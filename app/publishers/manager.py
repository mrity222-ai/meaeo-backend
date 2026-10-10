from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select
from app.database.models import Campaign, CampaignPost, BusinessChannel
from app.database.session import SessionLocal
from app.publishers.asset_preparation import AssetPreparationService
from app.publishers.factory import PublisherFactory
from app.schemas.publishing import PublishedPost, PublishingResult, publication_failure_flags
from app.schemas.schedule import PublishingSchedule
from app.services.campaign_post_publication_service import CampaignPostPublicationService


def _is_post_due(schedule, post) -> bool:
    if not post.publish_date or not post.publish_time:
        return False
    # _build_schedule supplies dates and times in its declared timezone.
    zone = ZoneInfo(schedule.timezone or "UTC")
    due = datetime.combine(post.publish_date, post.publish_time).replace(tzinfo=zone)
    return due <= datetime.now(timezone.utc)


class PublishManager:
    @staticmethod
    def _post_result(post, platform, status, external_id="", errors=None, **flags):
        return PublishedPost(platform=platform, day=post.day, title=post.title, status=status,
                             external_id=external_id, image_path=post.image_path,
                             image_source=post.image_source, errors=errors or [], **flags)

    def _targets(self, db, schedule, results):
        service = CampaignPostPublicationService(db)
        service.recover_stale_processing()
        for post in schedule.posts:
            for platform in dict.fromkeys(post.platforms):
                if not _is_post_due(schedule, post):
                    results.append(self._post_result(post, platform, "scheduled"))
                    continue
                # Content generation schedules have no persisted post identity yet.
                # They are previews; delivery starts only through persisted campaign posts.
                if not post.campaign_post_id or not post.business_channel_id:
                    results.append(self._post_result(post, platform, "scheduled"))
                    continue
                stored = db.scalar(select(CampaignPost).where(CampaignPost.id == post.campaign_post_id,
                                       CampaignPost.tenant_id == schedule.tenant_id))
                campaign = db.scalar(select(Campaign).where(Campaign.id == stored.campaign_id,
                    Campaign.tenant_id == schedule.tenant_id,
                    Campaign.business_account_id == schedule.business_account_id)) if stored else None
                channel = db.scalar(select(BusinessChannel).where(BusinessChannel.id == post.business_channel_id,
                    BusinessChannel.tenant_id == schedule.tenant_id,
                    BusinessChannel.business_account_id == schedule.business_account_id,
                    BusinessChannel.platform == platform, BusinessChannel.status == "active",
                    BusinessChannel.is_enabled.is_(True)))
                approval_ok = campaign is not None and (
                    (campaign.execution_mode == "autonomous" and stored.review_status in {"pending", "approved"})
                    or (campaign.execution_mode == "human_intervention" and stored.review_status == "approved"))
                due = stored.scheduled_for if stored else None
                if due is not None and due.tzinfo is None:
                    due = due.replace(tzinfo=timezone.utc)
                if (not approval_ok or not channel or campaign.status != "running"
                        or due is None or due > datetime.now(timezone.utc)
                        or stored.publish_status != "processing" or platform not in stored.platforms):
                    results.append(self._post_result(post, platform, "blocked", errors=["Post is not eligible for publishing."]))
                    continue
                publication = service.get_or_create(tenant_id=schedule.tenant_id,
                    campaign_post_id=post.campaign_post_id, business_channel_id=post.business_channel_id,
                    platform=platform)
                if publication.status == "published":
                    results.append(self._post_result(post, platform, "published", publication.external_id or ""))
                    continue
                if publication.status in {"processing", "reconciliation_required"}:
                    results.append(self._post_result(post, platform, "reconciliation_required",
                        errors=[publication.last_error or "Publication is in progress; do not resend."], outcome_unknown=True))
                    continue
                claimed = service.mark_processing(publication)
                if claimed is None:
                    db.refresh(publication)
                    results.append(self._post_result(post, platform, publication.status,
                        publication.external_id or "", outcome_unknown=publication.status != "published"))
                    continue
                # Preflight failures happen before any provider submission.
                try:
                    provider = PublisherFactory.get_provider(platform)
                    target = self._single_post_schedule(schedule, post, platform)
                    target = AssetPreparationService(db).prepare_schedule(target)
                except Exception as exc:
                    service.mark_failed(claimed, str(exc))
                    results.append(self._post_result(post, platform, "failed", errors=[str(exc)]))
                    continue
                yield provider, target, claimed, post, platform

    def _record(self, db, publication, post, platform, result=None, exc=None):
        service = CampaignPostPublicationService(db)
        if exc is not None:
            item = self._post_result(post, platform, "failed", errors=[str(exc)], **publication_failure_flags(exc))
        else:
            matches = [item for item in result.posts if item.platform == platform and item.day == post.day]
            if len(matches) != 1:
                item = self._post_result(post, platform, "reconciliation_required",
                    errors=["Provider did not return one unambiguous publication result."], outcome_unknown=True)
            else:
                item = matches[0]
        if service.result_is_successful(item):
            service.mark_published(publication, item.external_id)
        elif item.outcome_unknown or item.status in {"scheduled", "success", "processing"} or (item.status == "published" and not item.external_id):
            item = item.model_copy(update={"status":"reconciliation_required", "outcome_unknown":True})
            service.mark_reconciliation_required(publication, service.result_error(item))
        else:
            service.mark_failed(publication, service.result_error(item))
        return item

    @staticmethod
    def _result(results):
        successful = sum(item.status == "published" and bool(item.external_id) for item in results)
        return PublishingResult(posts=results, successful=successful,
                                failed=len(results)-successful, provider="multi")

    def publish(self, schedule: PublishingSchedule) -> PublishingResult:
        with SessionLocal() as db:
            results = []
            for provider, target, publication, post, platform in self._targets(db, schedule, results):
                try:
                    result = provider.publish(target)
                except Exception as exc:
                    results.append(self._record(db, publication, post, platform, exc=exc))
                else:
                    results.append(self._record(db, publication, post, platform, result=result))
            return self._result(results)

    async def apublish(self, schedule: PublishingSchedule) -> PublishingResult:
        with SessionLocal() as db:
            results = []
            for provider, target, publication, post, platform in self._targets(db, schedule, results):
                try:
                    result = await provider.apublish(target)
                except Exception as exc:
                    results.append(self._record(db, publication, post, platform, exc=exc))
                else:
                    results.append(self._record(db, publication, post, platform, result=result))
            return self._result(results)

    @staticmethod
    def _single_post_schedule(schedule, post, platform):
        return PublishingSchedule(campaign_name=schedule.campaign_name, tenant_id=schedule.tenant_id,
            business_account_id=schedule.business_account_id, timezone=schedule.timezone,
            posts=[post.model_copy(update={"platforms":[platform]})])
