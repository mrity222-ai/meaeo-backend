from app.database.session import SessionLocal
from app.database.models import CampaignPost
from app.workers.celery_app import celery_app
from app.workers.campaign_scheduler import CampaignScheduler


@celery_app.task(name="app.workers.tasks.sync_analytics_task")
def sync_analytics_task():
    import asyncio
    from datetime import datetime, timedelta, timezone
    from sqlalchemy import select
    from app.models.config import settings
    from app.database.models import Campaign, BusinessChannel, BusinessAccount, CampaignPostPublication
    from app.api.analytics import get_campaign_analytics
    from app.security.tenant import TenantContext
    from app.services.google_reviews_service import GoogleBusinessService
    from app.repositories.analytics_repository import AnalyticsRepository
    if not settings.ANALYTICS_SYNC_ENABLED:
        return {"status": "disabled"}
    counts = {"campaigns": 0, "profiles": 0, "unavailable": 0}
    with SessionLocal() as db:
        campaigns = db.scalars(select(Campaign).join(CampaignPost,
            CampaignPost.campaign_id == Campaign.id).join(CampaignPostPublication,
            CampaignPostPublication.campaign_post_id == CampaignPost.id).where(
                CampaignPost.tenant_id == Campaign.tenant_id,
                CampaignPostPublication.tenant_id == Campaign.tenant_id,
                CampaignPostPublication.status == "published").distinct()).all()
        for campaign in campaigns:
            try:
                result = get_campaign_analytics(campaign.id, campaign.business_account_id,
                                                TenantContext(campaign.tenant_id), db)
                counts["campaigns" if result.last_updated else "unavailable"] += 1
            except Exception:
                db.rollback()
                counts["unavailable"] += 1
        channels = db.scalars(select(BusinessChannel).join(BusinessAccount,
            BusinessAccount.id == BusinessChannel.business_account_id).where(
                BusinessChannel.tenant_id == BusinessAccount.tenant_id,
                BusinessAccount.status == "active", BusinessChannel.status == "active",
                BusinessChannel.is_enabled.is_(True), BusinessChannel.platform == "google_business")).all()
        end = datetime.now(timezone.utc).date() - timedelta(days=1)
        for channel in channels:
            try:
                result = asyncio.run(GoogleBusinessService(business_account_id=channel.business_account_id).fetch_performance(
                    db, channel.tenant_id, end - timedelta(days=29), end, channel.external_account_id))
                AnalyticsRepository().save_profile_performance(channel.tenant_id, channel.business_account_id, result)
                counts["profiles" if result["last_updated"] else "unavailable"] += 1
            except Exception:
                db.rollback()
                counts["unavailable"] += 1
                try:
                    AnalyticsRepository().save_profile_performance(channel.tenant_id, channel.business_account_id, {
                        "business_account_id": channel.business_account_id, "channel_id": channel.id,
                        "location_name": channel.external_account_id, "scope": "business_profile",
                        "start_date": (end - timedelta(days=29)).isoformat(), "end_date": end.isoformat(),
                        "data_source": "unavailable", "last_updated": None,
                        "last_attempted": datetime.now(timezone.utc).isoformat(), "metrics": {}, "daily": [],
                        "availability": "unavailable", "unavailable_reason": "Background sync failed; reconnect or retry fetching performance.",
                    })
                except Exception:
                    db.rollback()
    return {"status": "partial" if counts["unavailable"] else "success", **counts}


@celery_app.task(name="app.workers.tasks.process_due_posts_task", bind=True)
def process_due_posts_task(self):
    """
    Distributed Celery Task: Polls due campaign posts and triggers publishing.
    """
    worker = CampaignScheduler()
    processed_count = worker.run_once()
    return {
        "status": "success",
        "processed_posts_count": processed_count,
    }


@celery_app.task(name="app.workers.tasks.publish_single_post_task", bind=True)
def publish_single_post_task(self, campaign_post_id: int):
    """
    Distributed Celery Task: Publishes a single campaign post asynchronously.
    """
    worker = CampaignScheduler()
    success = worker.process_single_post(campaign_post_id)
    with SessionLocal() as db:
        post = db.get(CampaignPost, campaign_post_id)
        current_status = post.publish_status if post else "not_found"
    return {
        "status": current_status,
        "campaign_post_id": campaign_post_id,
    }
