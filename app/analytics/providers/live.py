import asyncio
import re
from datetime import datetime, timezone
import httpx
from sqlalchemy import select
from app.analytics.providers.base import BaseAnalyticsProvider
from app.analytics.result import AnalyticsResult
from app.analytics.schemas import PostAnalytics
from app.database.models import Campaign, CampaignPost, CampaignPostPublication, BusinessChannel
from app.database.session import SessionLocal
from app.models.config import settings
from app.repositories.local_credential_repository import LocalCredentialRepository
from app.security.credential_service import CredentialService
from app.security.fernet import FernetEncryptionService
from app.security.tenant import TenantContext


class LiveAnalyticsProvider(BaseAnalyticsProvider):
    def __init__(self, tenant_id=None, db=None, credential_service=None, *, campaign_id=None, business_account_id=None):
        self.campaign_id = campaign_id
        self.business_account_id = business_account_id
        self.tenant_id = tenant_id
        self.db = db
        self.credentials = credential_service

    @property
    def provider_name(self):
        return "live"

    def _owned_credential(self, db, campaign_name, post):
        if not self.tenant_id:
            raise ValueError("Tenant context is required for live analytics.")
        stmt = select(BusinessChannel).join(CampaignPostPublication,
            CampaignPostPublication.business_channel_id == BusinessChannel.id).join(CampaignPost,
            CampaignPost.id == CampaignPostPublication.campaign_post_id).join(Campaign,
            Campaign.id == CampaignPost.campaign_id).where(
            Campaign.tenant_id == self.tenant_id, Campaign.campaign_name == campaign_name,
            CampaignPost.tenant_id == self.tenant_id, CampaignPostPublication.tenant_id == self.tenant_id,
            CampaignPostPublication.status == "published", CampaignPostPublication.external_id == post.external_id,
            CampaignPostPublication.platform == post.platform, BusinessChannel.tenant_id == self.tenant_id,
            BusinessChannel.business_account_id == Campaign.business_account_id,
            BusinessChannel.platform == post.platform)
        if self.campaign_id is not None:
            stmt = stmt.where(Campaign.id == self.campaign_id)
        if self.business_account_id is not None:
            stmt = stmt.where(Campaign.business_account_id == self.business_account_id)
        channel = db.scalar(stmt)
        if channel is None:
            raise ValueError("Published post is not owned by the selected business.")
        self._channel = channel
        credentials = self.credentials or CredentialService(LocalCredentialRepository(
            encryption=FernetEncryptionService(settings.CREDENTIAL_ENCRYPTION_KEY.get_secret_value())))
        credential = credentials.get_for_channel(TenantContext(self.tenant_id), channel.business_account_id, channel.id)
        if (credential is None or credential.platform != post.platform or credential.tenant_id != self.tenant_id
                or credential.business_account_id != channel.business_account_id
                or credential.business_channel_id != channel.id or credential.is_expired(buffer_seconds=0)):
            raise ValueError("Connected account credentials are unavailable or expired.")
        return credential

    @staticmethod
    def _query(external_id, token, **params):
        if not re.fullmatch(r"[A-Za-z0-9_]+", external_id):
            raise ValueError("Invalid published post identifier.")
        suffix = params.pop("suffix", "")
        response = httpx.get(f"https://graph.facebook.com/{settings.META_API_VERSION}/{external_id}{suffix}",
                            headers={"Authorization": f"Bearer {token}"}, params=params, timeout=5.0)
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, dict) or data.get("error"):
            raise ValueError("Platform analytics are unavailable.")
        return data

    def _fetch(self, post, credential):
        if post.platform == "linkedin":
            return self._fetch_linkedin(post, credential)
        token = ((credential.page_access_token or credential.metadata.get("facebook_page_access_token") or credential.access_token)
                 if post.platform == "facebook" else credential.access_token)
        if not token:
            raise ValueError("Connected account token is unavailable.")
        metrics = {}
        errors = []
        try:
            fields = "likes.summary(true),comments.summary(true),shares" if post.platform == "facebook" else "like_count,comments_count"
            data = self._query(post.external_id, token, fields=fields)
            if post.platform == "facebook":
                for key in ("likes", "comments"):
                    value = data.get(key, {}).get("summary", {}).get("total_count")
                    if isinstance(value, int) and not isinstance(value, bool) and value >= 0:
                        metrics[key] = value
                value = data.get("shares", {}).get("count")
                if isinstance(value, int) and not isinstance(value, bool) and value >= 0:
                    metrics["shares"] = value
            else:
                for key, field in (("likes", "like_count"), ("comments", "comments_count")):
                    value = data.get(field)
                    if isinstance(value, int) and not isinstance(value, bool) and value >= 0:
                        metrics[key] = value
        except (httpx.HTTPError, ValueError, TypeError, AttributeError):
            errors.append("Post engagement data is unavailable.")
        # Request Instagram metrics separately: one unsupported metric must not hide reach.
        # Facebook legacy reach is intentionally unavailable, never inferred from engagement/views.
        if post.platform == "instagram":
            for metric, key in (("reach", "reach"), ("saved", "saves"), ("shares", "shares")):
                try:
                    data = self._query(post.external_id, token, suffix="/insights", metric=metric)
                    for item in data.get("data", []):
                        if item.get("name") != metric:
                            continue
                        values = item.get("values", [])
                        value = item.get("total_value", {}).get("value")
                        if value is None and values:
                            value = values[-1].get("value")
                        if isinstance(value, int) and not isinstance(value, bool) and value >= 0:
                            metrics[key] = value
                except (httpx.HTTPError, ValueError, TypeError, AttributeError):
                    errors.append(f"{key} is unavailable.")
        return metrics, errors

    def _fetch_linkedin(self, post, credential):
        organization = self._channel.external_account_id
        if not re.fullmatch(r"urn:li:organization:\d+", organization or ""):
            return {}, ["Company Page analytics requires a connected organization, not a personal profile."]
        if "rw_organization_admin" not in (credential.scope or "").split():
            return {}, ["Reconnect LinkedIn with approved rw_organization_admin analytics permission."]
        if not re.fullmatch(r"urn:li:(share|ugcPost):\d+", post.external_id or ""):
            return {}, ["LinkedIn post identifier is not supported for share statistics."]
        key = "shares" if ":share:" in post.external_id else "ugcPosts[0]"
        response = httpx.get("https://api.linkedin.com/rest/organizationalEntityShareStatistics",
            headers={"Authorization": f"Bearer {credential.access_token}",
                     "LinkedIn-Version": settings.LINKEDIN_ANALYTICS_API_VERSION,
                     "X-Restli-Protocol-Version": "2.0.0"},
            params={"q": "organizationalEntity", "organizationalEntity": organization,
                    key: f"List({post.external_id})" if key == "shares" else post.external_id}, timeout=10)
        response.raise_for_status()
        elements = response.json().get("elements", [])
        rows = [row for row in elements if row.get("organizationalEntity") == organization
                and row.get("share", row.get("ugcPost")) == post.external_id]
        if len(rows) != 1:
            return {}, ["LinkedIn did not return statistics for this post."]
        stats = rows[0].get("totalShareStatistics", {})
        metrics = {}
        for field, name in {"impressionCount": "impressions", "clickCount": "clicks",
                            "likeCount": "likes", "commentCount": "comments", "shareCount": "shares"}.items():
            value = stats.get(field)
            if isinstance(value, int) and not isinstance(value, bool) and value >= 0:
                metrics[name] = value
        value = stats.get("engagement")
        if isinstance(value, (float, int)) and not isinstance(value, bool) and 0 <= value <= 1:
            metrics["engagement_rate"] = value
        return metrics, ["Organic lifetime post statistics; sponsored activity and unique reach are unavailable."]

    def collect(self, campaign_name, publishing):
        posts = []
        def collect_with(db):
            for post in publishing.posts:
                if post.status != "published":
                    continue
                metrics, errors = {}, []
                if not post.external_id:
                    errors = ["The published post identifier is missing."]
                elif post.platform not in {"facebook", "instagram", "linkedin"}:
                    errors = ["Performance metrics for this platform are not implemented."]
                else:
                    try:
                        credential = self._owned_credential(db, campaign_name, post)
                        metrics, errors = self._fetch(post, credential)
                    except httpx.HTTPStatusError as error:
                        code = error.response.status_code
                        errors = [{401: "Account authorization expired; reconnect to fetch analytics.",
                                   403: "Analytics API access or account permissions are missing.",
                                   429: "Analytics rate limit reached; retry later."}.get(code,
                                   "Platform analytics request failed; retry later.")]
                    except Exception:
                        errors = ["Analytics are unavailable for this connected account."]
                posts.append(PostAnalytics(campaign_name=campaign_name, platform=post.platform,
                    external_post_id=post.external_id, published_at=post.published_at, **metrics,
                    data_source="platform_api" if metrics else "unavailable",
                    last_updated=datetime.now(timezone.utc) if metrics else None,
                    availability="partial" if metrics else "unavailable",
                    unavailable_reason=" ".join(errors) or "Unsupported metrics remain unavailable."))
        if self.db is not None:
            collect_with(self.db)
        elif self.tenant_id:
            with SessionLocal() as db:
                collect_with(db)
        else:
            collect_with(None)
        return AnalyticsResult(posts=posts, provider=self.provider_name,
                               success=any(post.last_updated is not None for post in posts))

    async def acollect(self, campaign_name, publishing):
        return await asyncio.to_thread(self.collect, campaign_name, publishing)
