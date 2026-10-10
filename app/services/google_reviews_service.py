from __future__ import annotations

from datetime import datetime, timezone
import httpx
import re
from urllib.parse import quote
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.agents.review_responder import ReviewResponderAgent
from app.database.models import BusinessAccount, BusinessChannel, GoogleBusinessPost, GoogleBusinessReview
from app.models.config import settings
from app.repositories.local_credential_repository import LocalCredentialRepository
from app.schemas.google_business import GooglePostCreateRequest
from app.security.credential_service import CredentialService
from app.security.fernet import FernetEncryptionService
from app.security.tenant import TenantContext


RATING_MAP = {
    "STAR_RATING_UNSPECIFIED": 5,
    "ONE": 1,
    "TWO": 2,
    "THREE": 3,
    "FOUR": 4,
    "FIVE": 5,
}


class GoogleBusinessService:
    """
    Comprehensive service for Google Business Profile:
    - Review fetching & synchronization
    - AI-powered Local SEO Review Replies
    - Publishing review replies to Google My Business API
    - Daily Promotional Offers & Local Posts
    - Profile Local SEO Optimization & Description Updates
    """

    def __init__(
        self,
        credential_service: CredentialService | None = None,
        http_client: httpx.AsyncClient | None = None,
        business_account_id: int | None = None,
    ):
        if credential_service is None:
            encryption = FernetEncryptionService(
                settings.CREDENTIAL_ENCRYPTION_KEY.get_secret_value()
            )
            repository = LocalCredentialRepository(
                encryption=encryption,
            )
            credential_service = CredentialService(
                repository=repository,
            )

        self.business_account_id = business_account_id
        self.credential_service = credential_service
        self.http_client = http_client
        self.responder_agent = ReviewResponderAgent()

    def owned_channels(self, db: Session, tenant_id: str) -> list[BusinessChannel]:
        if self.business_account_id is not None:
            business = db.scalar(select(BusinessAccount).where(
                BusinessAccount.id == self.business_account_id,
                BusinessAccount.tenant_id == tenant_id,
                BusinessAccount.status == "active",
            ))
            if business is None:
                raise HTTPException(404, "Active business not found for this tenant")
        stmt = select(BusinessChannel).join(BusinessAccount,
            BusinessAccount.id == BusinessChannel.business_account_id).where(
            BusinessChannel.tenant_id == tenant_id,
            BusinessAccount.tenant_id == tenant_id,
            BusinessAccount.status == "active",
            BusinessChannel.platform == "google_business",
            BusinessChannel.status == "active",
            BusinessChannel.is_enabled.is_(True),
        )
        if self.business_account_id is not None:
            stmt = stmt.where(BusinessChannel.business_account_id == self.business_account_id)
        return list(db.scalars(stmt).all())

    async def fetch_performance(self, db: Session, tenant_id: str, start_date, end_date,
                                location_name: str | None = None) -> dict:
        if start_date > end_date or (end_date - start_date).days > 365:
            raise HTTPException(400, "Choose an ordered date range of at most 366 days")
        channel, location, token = await self._get_channel_and_credential(db, tenant_id, location_name)
        result = {"business_account_id": self.business_account_id,
                  "channel_id": channel.id if channel else None,
                  "location_name": channel.external_account_id if channel else None,
                  "start_date": start_date.isoformat(), "end_date": end_date.isoformat(),
                  "scope": "business_profile", "data_source": "unavailable", "last_updated": None,
                  "last_attempted": datetime.now(timezone.utc).isoformat(),
                  "availability": "unavailable", "metrics": {}, "daily": [], "unavailable_reason": None}
        if not token or not location:
            result["unavailable_reason"] = "Connect or reconnect Google Business before fetching performance."
            return result
        match = re.fullmatch(r"(?:accounts/[^/]+/)?locations/([A-Za-z0-9_-]+)", location)
        if not match:
            raise HTTPException(409, "Connected Google location mapping is invalid")
        names = ["CALL_CLICKS", "WEBSITE_CLICKS", "BUSINESS_DIRECTION_REQUESTS",
                 "BUSINESS_IMPRESSIONS_DESKTOP_MAPS", "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
                 "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH", "BUSINESS_IMPRESSIONS_MOBILE_SEARCH"]
        params = [("dailyMetrics", name) for name in names]
        for prefix, value in (("startDate", start_date), ("endDate", end_date)):
            for part in ("year", "month", "day"):
                params.append((f"dailyRange.{prefix}.{part}", str(getattr(value, part))))
        client = self.http_client or httpx.AsyncClient(timeout=15)
        try:
            response = await client.get(
                f"https://businessprofileperformance.googleapis.com/v1/locations/{match[1]}:fetchMultiDailyMetricsTimeSeries",
                headers={"Authorization": f"Bearer {token}"}, params=params)
            response.raise_for_status()
            payload = response.json()
            from datetime import date
            daily = {}
            for group in payload.get("multiDailyMetricTimeSeries", []):
                for series in group.get("dailyMetricTimeSeries", []):
                    name = series.get("dailyMetric")
                    if name not in names or series.get("dailySubEntityType"):
                        continue
                    for item in series.get("timeSeries", {}).get("datedValues", []):
                        stamp = item.get("date", {})
                        day = date(stamp["year"], stamp["month"], stamp["day"])
                        value = item.get("value")
                        if isinstance(value, bool) or not str(value).isdigit():
                            continue
                        if start_date <= day <= end_date:
                            daily.setdefault(day.isoformat(), {})[name] = int(value)
            result["daily"] = [{"date": day, "metrics": values} for day, values in sorted(daily.items())]
            expected = (end_date - start_date).days + 1
            for name in names:
                values = [values.get(name) for values in daily.values()]
                result["metrics"][name] = sum(values) if len(values) == expected and all(v is not None for v in values) else None
            if daily:
                result.update(data_source="platform_api", last_updated=datetime.now(timezone.utc).isoformat(),
                              availability="available" if all(v is not None for v in result["metrics"].values()) else "partial")
                if result["availability"] == "partial":
                    result["unavailable_reason"] = "Some dates or metrics were not returned; incomplete range totals remain unavailable."
            else:
                result["unavailable_reason"] = "Google returned no daily performance values for this range."
        except httpx.HTTPStatusError as error:
            code = error.response.status_code
            result["unavailable_reason"] = ({401: "Google authorization expired; reconnect the account.",
                403: "Google Performance API access or account permissions are missing.",
                429: "Google rate limit reached; retry later."}.get(code, "Google performance request failed; retry later."))
        except (httpx.HTTPError, ValueError, TypeError, KeyError, AttributeError):
            result["unavailable_reason"] = "Google performance response is unavailable or invalid; retry later."
        finally:
            if self.http_client is None:
                await client.aclose()
        return result

    def select_channel(self, db: Session, tenant_id: str,
                       location_name: str | None = None) -> BusinessChannel | None:
        channels = self.owned_channels(db, tenant_id)
        if location_name:
            channels = [c for c in channels if c.external_account_id == location_name]
            if not channels:
                raise HTTPException(404, "Google location not connected to this business")
        if len(channels) > 1:
            raise HTTPException(400, "Select a business and Google location")
        return channels[0] if channels else None

    def owned_review(self, db: Session, tenant_id: str, review_id: int) -> GoogleBusinessReview:
        channels = self.owned_channels(db, tenant_id)
        review = db.scalar(select(GoogleBusinessReview).where(
            GoogleBusinessReview.id == review_id,
            GoogleBusinessReview.tenant_id == tenant_id,
            GoogleBusinessReview.business_channel_id.in_([c.id for c in channels]),
        ))
        channel = next((c for c in channels if review and c.id == review.business_channel_id), None)
        if review is None or channel.external_account_id != review.location_name:
            raise HTTPException(404, "Review not found for this business")
        return review

    async def _get_channel_and_credential(
        self, db: Session, tenant_id: str, location_name: str | None = None,
    ) -> tuple[BusinessChannel | None, str | None, str | None]:
        channel = self.select_channel(db, tenant_id, location_name)
        if channel is None:
            return None, None, None
        try:
            credential = await self.credential_service.get_valid_credential_for_channel(
                context=TenantContext(tenant_id=tenant_id),
                business_account_id=channel.business_account_id,
                business_channel_id=channel.id,
            )
        except ValueError as error:
            if str(error) in {"OAuth credential not found for business channel.", "OAuth credential expired and has no refresh token."}:
                return channel, channel.external_account_id, None
            raise HTTPException(403, "Google credentials could not be validated for this business.") from None
        except RuntimeError:
            raise HTTPException(409, "Google credentials need reconnection before use.") from None
        if credential is None:
            return channel, channel.external_account_id, None
        if (credential.tenant_id != tenant_id
                or credential.business_account_id != channel.business_account_id
                or credential.business_channel_id != channel.id
                or credential.platform != "google_business"):
            raise HTTPException(403, "Google credential ownership mismatch")
        token = (credential.metadata.get("gbp_access_token")
                 or credential.metadata.get("google_access_token")
                 or credential.metadata.get("access_token") or credential.access_token)
        location = channel.external_account_id
        if re.fullmatch(r"locations/[A-Za-z0-9_-]+", location):
            account = credential.metadata.get("google_account_name") or (channel.platform_metadata or {}).get("google_account_name")
            if account and re.fullmatch(r"accounts/[A-Za-z0-9_-]+", account):
                location = f"{account}/{location}"
        return channel, location, token

    @staticmethod
    def require_live_location(location, token, *, account_required=True):
        pattern = r"accounts/[A-Za-z0-9_-]+/locations/[A-Za-z0-9_-]+" if account_required else r"(?:accounts/[A-Za-z0-9_-]+/)?locations/[A-Za-z0-9_-]+"
        if not token:
            raise HTTPException(409, "Google credentials are unavailable. Connect or reconnect this business.")
        if not location or not re.fullmatch(pattern, location):
            raise HTTPException(409, "Verified Google account/location mapping is missing. Reconnect this business.")

    async def fetch_and_sync_reviews(
        self,
        db: Session,
        tenant_id: str,
        location_name: str | None = None,
    ) -> list[GoogleBusinessReview]:
        """
        Fetches live reviews from Google My Business API and syncs to DB.
        If credentials/API are unreachable, returns existing DB records.
        """
        channel, loc, access_token = await self._get_channel_and_credential(
            db, tenant_id, location_name
        )

        active_loc = channel.external_account_id if channel else None

        if access_token and loc:
            self.require_live_location(loc, access_token)
            try:
                # Google My Business Reviews API:
                # GET https://mybusiness.googleapis.com/v4/{name=accounts/*/locations/*}/reviews
                url = f"https://mybusiness.googleapis.com/v4/{loc}/reviews"
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                }

                client = self.http_client or httpx.AsyncClient(timeout=25.0)
                should_close = self.http_client is None
                try:
                    res = await client.get(url, headers=headers)
                finally:
                    if should_close:
                        await client.aclose()

                res.raise_for_status()
                if res.status_code == 200:
                    data = res.json()
                    reviews_data = data.get("reviews", [])
                    for item in reviews_data:
                        raw_id = item.get("reviewId") or item.get("name", "").split("/")[-1]
                        if not raw_id:
                            continue

                        stmt = select(GoogleBusinessReview).where(
                            GoogleBusinessReview.tenant_id == tenant_id,
                            GoogleBusinessReview.business_channel_id == channel.id,
                            GoogleBusinessReview.location_name == active_loc,
                            GoogleBusinessReview.review_id == raw_id,
                        )
                        existing = db.scalars(stmt).first()

                        reviewer = item.get("reviewer", {})
                        rating_str = str(item.get("starRating", "FIVE"))
                        rating_int = RATING_MAP.get(rating_str, 5) if rating_str in RATING_MAP else int(rating_str) if rating_str.isdigit() else 5
                        comment = item.get("comment", "")

                        reply_data = item.get("reviewReply")
                        reply_comment = reply_data.get("comment") if reply_data else None

                        if existing:
                            existing.star_rating = rating_int
                            existing.comment = comment
                            if reply_comment:
                                existing.reply_text = reply_comment
                                existing.reply_status = "replied"
                        else:
                            new_rev = GoogleBusinessReview(
                                tenant_id=tenant_id,
                                business_channel_id=channel.id if channel else None,
                                location_name=active_loc,
                                review_id=raw_id,
                                reviewer_name=reviewer.get("displayName") or "Customer",
                                reviewer_photo_url=reviewer.get("profilePhotoUrl"),
                                star_rating=rating_int,
                                comment=comment,
                                reply_status="replied" if reply_comment else "unanswered",
                                reply_text=reply_comment,
                            )
                            db.add(new_rev)
                    db.commit()
            except Exception:
                db.rollback()
                raise HTTPException(502, "Google reviews could not be synchronized. Stored reviews were not updated.") from None

        # Return reviews from database for this tenant
        stmt = (
            select(GoogleBusinessReview)
            .where(GoogleBusinessReview.tenant_id == tenant_id,
                   GoogleBusinessReview.business_channel_id == (channel.id if channel else -1),
                   GoogleBusinessReview.location_name == active_loc)
            .order_by(GoogleBusinessReview.created_at.desc())
        )
        return list(db.scalars(stmt).all())

    async def generate_reply(
        self,
        db: Session,
        tenant_id: str,
        review_record_id: int,
        business_name: str | None = None,
        city: str | None = None,
        services: list[str] | None = None,
        tone: str | None = "warm and professional",
    ) -> GoogleBusinessReview:
        """
        Uses ReviewResponderAgent to craft a localized, SEO-rich response.
        """
        review = self.owned_review(db, tenant_id, review_record_id)

        b_name = business_name or "Our Business"
        b_city = city or "Our City"

        ai_res = await self.responder_agent.generate_reply(
            reviewer_name=review.reviewer_name,
            star_rating=review.star_rating,
            review_text=review.comment,
            business_name=b_name,
            city=b_city,
            services=services or [],
            tone=tone or "warm, polite and professional",
        )

        review.reply_text = ai_res.get("reply_text")
        review.reply_status = "generated"
        review.sentiment = ai_res.get("sentiment")
        review.seo_keywords_used = ai_res.get("seo_keywords_used")
        db.commit()
        db.refresh(review)
        return review

    async def send_reply_to_google(
        self,
        db: Session,
        tenant_id: str,
        review_record_id: int,
        reply_text: str,
    ) -> GoogleBusinessReview:
        """
        Publishes the reply to Google My Business API and records in DB.
        """
        review = self.owned_review(db, tenant_id, review_record_id)

        channel, loc, access_token = await self._get_channel_and_credential(
            db, tenant_id, review.location_name
        )

        self.require_live_location(loc, access_token)
        if not reply_text.strip():
            raise HTTPException(400, "Reply text is required")
        url = f"https://mybusiness.googleapis.com/v4/{loc}/reviews/{quote(review.review_id, safe='')}/reply"
        client = self.http_client or httpx.AsyncClient(timeout=25.0)
        try:
            res = await client.put(url, json={"comment": reply_text}, headers={"Authorization": f"Bearer {access_token}"})
            res.raise_for_status()
            data = res.json()
            if not isinstance(data, dict) or data.get("comment") != reply_text:
                raise ValueError("Google reply confirmation was incomplete")
        except httpx.HTTPStatusError as error:
            if error.response.status_code >= 500:
                review.reply_status = "reconciliation_required"
                db.commit()
                raise HTTPException(502, "Google reply outcome is unknown. Check Google before retrying.") from None
            raise HTTPException(502, f"Google rejected the reply (HTTP {error.response.status_code}).") from None
        except (httpx.HTTPError, ValueError):
            review.reply_status = "reconciliation_required"
            db.commit()
            raise HTTPException(502, "Google reply outcome could not be confirmed. Check Google before retrying.") from None
        finally:
            if self.http_client is None:
                await client.aclose()

        review.reply_text = reply_text
        review.reply_status = "replied"
        review.replied_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(review)
        return review

    async def publish_local_post(
        self,
        db: Session,
        tenant_id: str,
        post_data: GooglePostCreateRequest,
    ) -> GoogleBusinessPost:
        """
        Creates and immediately publishes a Google Business Profile Local Post
        (supporting OFFER, STANDARD, or EVENT with coupon codes, dates, and CTA).
        """
        channel, loc, access_token = await self._get_channel_and_credential(
            db, tenant_id, post_data.location_name
        )
        self.require_live_location(loc, access_token)
        active_loc = channel.external_account_id

        new_post = GoogleBusinessPost(
            tenant_id=tenant_id,
            business_channel_id=channel.id if channel else None,
            location_name=active_loc,
            post_type=post_data.post_type.upper(),
            summary=post_data.summary,
            offer_title=post_data.offer_title,
            coupon_code=post_data.coupon_code,
            redeem_url=post_data.redeem_url,
            terms_conditions=post_data.terms_conditions,
            start_date=post_data.start_date,
            end_date=post_data.end_date,
            call_to_action_type=post_data.call_to_action_type,
            call_to_action_url=post_data.call_to_action_url,
            media_url=post_data.media_url,
            status="draft",
        )
        db.add(new_post)
        db.commit()
        db.refresh(new_post)

        # Build payload according to Google My Business Local Post specification
        payload: dict = {
            "languageCode": "en-US",
            "summary": post_data.summary,
            "topicType": post_data.post_type.upper(),
        }

        if post_data.media_url:
            payload["media"] = [{"mediaFormat": "PHOTO", "sourceUrl": post_data.media_url}]

        if post_data.post_type.upper() == "OFFER":
            offer_dict = {}
            if post_data.coupon_code:
                offer_dict["couponCode"] = post_data.coupon_code
            if post_data.redeem_url:
                offer_dict["redeemOnlineUrl"] = post_data.redeem_url
            if post_data.terms_conditions:
                offer_dict["termsConditions"] = post_data.terms_conditions
            if offer_dict:
                payload["offer"] = offer_dict

            start = post_data.start_date or datetime.now(timezone.utc)
            end = post_data.end_date or (datetime.now(timezone.utc))
            payload["event"] = {
                "title": post_data.offer_title or "Special Promotional Offer",
                "schedule": {
                    "startDate": {"year": start.year, "month": start.month, "day": start.day},
                    "endDate": {"year": end.year, "month": end.month, "day": end.day},
                },
            }
        elif post_data.post_type.upper() == "EVENT" and post_data.offer_title:
            start = post_data.start_date or datetime.now(timezone.utc)
            end = post_data.end_date or (datetime.now(timezone.utc))
            payload["event"] = {
                "title": post_data.offer_title,
                "schedule": {
                    "startDate": {"year": start.year, "month": start.month, "day": start.day},
                    "endDate": {"year": end.year, "month": end.month, "day": end.day},
                },
            }

        if post_data.call_to_action_type and post_data.call_to_action_type != "NONE":
            cta_obj = {"actionType": post_data.call_to_action_type}
            if post_data.call_to_action_url:
                cta_obj["url"] = post_data.call_to_action_url
            payload["callToAction"] = cta_obj

        # Dispatch to Google API if access token is available
        if access_token and active_loc and not active_loc.startswith("mock"):
            url = f"https://mybusiness.googleapis.com/v4/{loc}/localPosts"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            client = self.http_client or httpx.AsyncClient(timeout=30.0)
            should_close = self.http_client is None
            try:
                res = await client.post(url, json=payload, headers=headers)
                res.raise_for_status()
                res_data = res.json()
                identifier = res_data.get("name") if isinstance(res_data, dict) else None
                if not identifier or not identifier.startswith(f"{loc}/localPosts/"):
                    raise ValueError("Google did not confirm the created post identifier")
                new_post.google_post_id = identifier
                google_state = res_data.get("state")
                if google_state == "LIVE":
                    new_post.status = "published"
                    new_post.published_at = datetime.now(timezone.utc)
                elif google_state == "REJECTED":
                    new_post.status = "failed"
                    new_post.error_message = "Google rejected this post."
                else:
                    new_post.status = "processing"
                    new_post.error_message = "Google accepted the post; publication is not yet confirmed."
            except httpx.HTTPStatusError as error:
                new_post.status = "reconciliation_required" if error.response.status_code >= 500 else "failed"
                new_post.error_message = f"Google API HTTP {error.response.status_code}. Check Google before retrying if the outcome is unknown."
            except (httpx.HTTPError, ValueError, TypeError):
                new_post.status = "reconciliation_required"
                new_post.error_message = "Google post outcome could not be confirmed. Check Google before retrying."
            finally:
                if should_close:
                    await client.aclose()
        db.commit()
        db.refresh(new_post)
        return new_post

    async def update_profile_description(
        self,
        db: Session,
        tenant_id: str,
        location_name: str,
        description: str,
    ) -> dict:
        """
        Updates the business description on Google Business Profile via
        the Google Business Information API.
        """
        channel, loc, access_token = await self._get_channel_and_credential(
            db, tenant_id, location_name
        )
        self.require_live_location(loc, access_token, account_required=False)
        active_loc = "/".join(loc.split("/")[-2:])
        client = self.http_client or httpx.AsyncClient(timeout=25.0)
        try:
            res = await client.patch(
                f"https://mybusinessbusinessinformation.googleapis.com/v1/{active_loc}",
                params={"updateMask": "profile.description"},
                json={"profile": {"description": description}},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            res.raise_for_status()
            data = res.json()
            if data.get("name") != active_loc or data.get("profile", {}).get("description") != description:
                return {"success": False, "error": "Google did not confirm the updated description.", "location_name": active_loc}
            return {"success": True, "location_name": active_loc, "description": description}
        except httpx.HTTPStatusError as error:
            return {"success": False, "error": f"Google API HTTP {error.response.status_code}; description update was not confirmed.", "location_name": active_loc}
        except (httpx.HTTPError, ValueError, TypeError, AttributeError):
            return {"success": False, "error": "Google description update could not be confirmed. Check Google before retrying.", "location_name": active_loc}
        finally:
            if self.http_client is None:
                await client.aclose()
