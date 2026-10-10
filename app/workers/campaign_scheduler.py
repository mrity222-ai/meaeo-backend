from __future__ import annotations
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, update, or_, and_
from app.database.models import Campaign, CampaignPost, BusinessAccount
from app.database.session import SessionLocal
from app.publishers.manager import PublishManager
from app.schemas.publishing import publication_failure_flags
from app.services.campaign_post_publishing_service import CampaignPostPublishingService
from app.services.campaign_post_publication_service import CampaignPostPublicationService


class CampaignScheduler:
    RETRY_DELAYS = (timedelta(minutes=1), timedelta(minutes=5))
    STALE_PROCESSING_AFTER = timedelta(minutes=10)

    def __init__(self, publisher=None):
        self.publisher = publisher if publisher is not None else PublishManager()

    @staticmethod
    def _utc(value):
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)

    def _eligible(self, now):
        return select(CampaignPost.id).join(Campaign, Campaign.id == CampaignPost.campaign_id).join(
            BusinessAccount, and_(BusinessAccount.id == Campaign.business_account_id,
                                  BusinessAccount.tenant_id == Campaign.tenant_id)).where(
            CampaignPost.tenant_id == Campaign.tenant_id, Campaign.status == "running",
            BusinessAccount.status == "active", CampaignPost.publish_status == "pending",
            CampaignPost.scheduled_for.is_not(None), CampaignPost.scheduled_for <= now,
            CampaignPost.publish_attempts < CampaignPost.max_publish_attempts,
            or_(CampaignPost.next_retry_at.is_(None), CampaignPost.next_retry_at <= now),
            or_(and_(Campaign.execution_mode == "autonomous", CampaignPost.review_status.in_(["pending", "approved"])),
                and_(Campaign.execution_mode == "human_intervention", CampaignPost.review_status == "approved")))

    def _claim_next_due_post(self, db, now, post_id=None):
        eligible = self._eligible(now)
        if post_id is not None:
            eligible = eligible.where(CampaignPost.id == post_id)
        candidate = db.scalar(eligible.order_by(CampaignPost.scheduled_for, CampaignPost.id)
                              .limit(1).with_for_update(skip_locked=True, of=CampaignPost))
        if candidate is None:
            db.rollback()
            return None
        claim = db.execute(update(CampaignPost).where(CampaignPost.id == candidate,
            CampaignPost.id.in_(eligible)).values(publish_status="processing",
            publish_attempts=CampaignPost.publish_attempts + 1, publishing_started_at=now,
            publishing_error=None).execution_options(synchronize_session=False))
        db.commit()
        if claim.rowcount != 1:
            return None
        return db.get(CampaignPost, candidate, populate_existing=True)

    def process_due_posts(self, *, now=None, limit=None):
        now = self._utc(now or datetime.now(timezone.utc))
        processed = 0
        with SessionLocal() as db:
            self._recover_stale_posts(db, now)
            while limit is None or processed < limit:
                post = self._claim_next_due_post(db, now)
                if post is None:
                    break
                try:
                    self._process_post(db, post, now, already_claimed=True)
                except Exception as exc:
                    db.rollback()
                    db.refresh(post)
                    self._handle_failure(db, post, exc, now)
                processed += 1
        return processed

    def run_once(self):
        return self.process_due_posts()

    def process_single_post(self, campaign_post_id, enforce_due_time=True):
        # Every worker delivery respects due time, including old callers passing False.
        now = datetime.now(timezone.utc)
        with SessionLocal() as db:
            stored = db.get(CampaignPost, campaign_post_id)
            if stored is None:
                return False
            if stored.publish_status == "published":
                return True
            post = self._claim_next_due_post(db, now, campaign_post_id)
            if post is None:
                return False
            try:
                self._process_post(db, post, now, already_claimed=True)
            except Exception as exc:
                db.rollback()
                db.refresh(post)
                self._handle_failure(db, post, exc, now)
            db.refresh(post)
            return post.publish_status == "published"

    def _recover_stale_posts(self, db, now):
        CampaignPostPublicationService(db).recover_stale_processing(now=now)
        result = db.execute(update(CampaignPost).where(CampaignPost.publish_status == "processing",
            CampaignPost.publishing_started_at.is_not(None),
            CampaignPost.publishing_started_at <= now-self.STALE_PROCESSING_AFTER).values(
            publish_status="reconciliation_required", next_retry_at=None, publishing_started_at=None,
            publishing_error="Publishing outcome is unknown after worker interruption. Reconcile before retrying.")
            .execution_options(synchronize_session=False))
        db.commit()
        return result.rowcount

    def _process_post(self, db, post, now=None, *, already_claimed=False):
        now = self._utc(now or datetime.now(timezone.utc))
        if not already_claimed:
            post = self._claim_next_due_post(db, now, post.id)
            if post is None:
                return None
        campaign = db.scalar(select(Campaign).where(Campaign.id == post.campaign_id,
                                                    Campaign.tenant_id == post.tenant_id))
        schedule = CampaignPostPublishingService(db)._build_schedule(campaign, [post], post.tenant_id)
        if not schedule.posts:
            self._handle_failure(db, post, ValueError("No publishing targets are configured."), now)
            return None
        result = self.publisher.publish(schedule)
        external_ids = dict(post.external_ids or {})
        expected = {(target.day, platform) for target in schedule.posts for platform in target.platforms}
        actual = {(item.day, item.platform) for item in result.posts}
        successes = [item for item in result.posts if item.status == "published" and item.external_id]
        for item in successes:
            external_ids[item.platform] = item.external_id
        post.external_ids = external_ids
        if actual == expected and len(result.posts) == len(expected) and len(successes) == len(expected):
            post.publish_status = "published"
            post.published_at = now
            post.publishing_started_at = None
            post.next_retry_at = None
            post.publishing_error = None
            db.commit()
        else:
            failures = [item for item in result.posts if item not in successes]
            missing = actual != expected or len(result.posts) != len(expected)
            unknown = missing or any(item.outcome_unknown or item.status in {
                "processing", "reconciliation_required", "scheduled", "success"} for item in failures)
            retryable = bool(failures) and all(item.retryable for item in failures) and not unknown
            message = "; ".join(f"{item.platform}: " + "; ".join(item.errors or [item.status]) for item in failures)
            self._handle_failure(db, post, ValueError(message or "Provider returned no complete publication result."),
                                 now, retryable=retryable, outcome_unknown=unknown)
        return result

    def _handle_failure(self, db, post, exc, now, *, external_ids=None, retryable=None, outcome_unknown=None):
        if external_ids is not None:
            post.external_ids = {**(post.external_ids or {}), **external_ids}
        flags = publication_failure_flags(exc)
        retryable = flags["retryable"] if retryable is None else retryable
        outcome_unknown = flags["outcome_unknown"] if outcome_unknown is None else outcome_unknown
        post.publishing_error = str(exc)
        post.publishing_started_at = None
        post.next_retry_at = None
        if outcome_unknown:
            post.publish_status = "reconciliation_required"
        elif retryable and post.publish_attempts < post.max_publish_attempts:
            post.publish_status = "pending"
            index = min(max(post.publish_attempts-1, 0), len(self.RETRY_DELAYS)-1)
            post.next_retry_at = now + self.RETRY_DELAYS[index]
        else:
            post.publish_status = "failed"
        db.commit()
