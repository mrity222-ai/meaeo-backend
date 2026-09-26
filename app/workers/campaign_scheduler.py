from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database.models import (
    Campaign,
    CampaignPost,
)
from app.database.session import SessionLocal
from app.publishers.manager import PublishManager
from app.services.campaign_post_publishing_service import (
    CampaignPostPublishingService,
)


class CampaignScheduler:

    RETRY_DELAYS = (
        timedelta(minutes=1),
        timedelta(minutes=5),
    )

    STALE_PROCESSING_AFTER = timedelta(
        minutes=10
    )

    def __init__(
        self,
        publisher=None,
    ):
        self.publisher = (
            publisher
            if publisher is not None
            else PublishManager()
        )

    def process_due_posts(
        self,
        *,
        now: datetime | None = None,
        limit: int | None = None,
    ) -> int:

        if now is None:
            now = datetime.now(timezone.utc)

        db = SessionLocal()

        processed = 0

        try:
            self._recover_stale_posts(
                db,
                now,
            )

            while True:

                if (
                    limit is not None
                    and processed >= limit
                ):
                    break

                post = self._claim_next_due_post(
                    db,
                    now,
                )

                if post is None:
                    break

                try:
                    self._process_post(
                        db,
                        post,
                        now,
                        already_claimed=True,
                    )

                except Exception as exc:
                    self._handle_failure(
                        db,
                        post,
                        exc,
                        now,
                    )

                processed += 1

            return processed

        finally:
            db.close()

    def _claim_next_due_post(
        self,
        db,
        now: datetime,
    ):

        stmt = (
            select(CampaignPost)
            .join(
                Campaign,
                Campaign.id
                == CampaignPost.campaign_id,
            )
            .where(
                CampaignPost.publish_status == "pending",
                CampaignPost.scheduled_for <= now,
                Campaign.status == "running",
                CampaignPost.tenant_id
                == Campaign.tenant_id,
            )
            .where(
                (
                    CampaignPost.next_retry_at.is_(None)
                )
                | (
                    CampaignPost.next_retry_at
                    <= now
                )
            )
            .order_by(
                CampaignPost.scheduled_for,
                CampaignPost.id,
            )
            .limit(1)
            .with_for_update(
                skip_locked=True,
                of=CampaignPost,
            )
        )

        post = db.scalar(stmt)

        if post is None:
            return None

        post.publish_status = "processing"

        post.publish_attempts = (
            post.publish_attempts + 1
        )

        post.publishing_started_at = now

        post.publishing_error = None

        db.commit()

        db.refresh(post)

        return post

    def _recover_stale_posts(
        self,
        db,
        now: datetime,
    ) -> int:

        cutoff = (
            now
            - self.STALE_PROCESSING_AFTER
        )

        stale_posts = list(
            db.scalars(
                select(CampaignPost).where(
                    CampaignPost.publish_status
                    == "processing",
                    CampaignPost.publishing_started_at
                    .is_not(None),
                    CampaignPost.publishing_started_at
                    <= cutoff,
                )
            ).all()
        )

        recovered = 0

        for post in stale_posts:

            if (
                post.publish_attempts
                >= post.max_publish_attempts
            ):

                post.publish_status = "failed"

                post.publishing_error = (
                    "Publishing attempt became stale "
                    "after the maximum number of "
                    "attempts was reached."
                )

                post.next_retry_at = None

            else:

                post.publish_status = "pending"

                retry_index = max(
                    post.publish_attempts - 1,
                    0,
                )

                if retry_index >= len(
                    self.RETRY_DELAYS
                ):
                    retry_index = (
                        len(self.RETRY_DELAYS) - 1
                    )

                post.next_retry_at = (
                    now
                    + self.RETRY_DELAYS[
                        retry_index
                    ]
                )

                post.publishing_error = (
                    "Publishing attempt became stale "
                    "and was returned to pending "
                    "for retry."
                )

            post.publishing_started_at = None

            recovered += 1

        if recovered:
            db.commit()

        return recovered

    def _process_post(
        self,
        db,
        post,
        now: datetime | None = None,
        *,
        already_claimed: bool = False,
    ):

        if now is None:
            now = datetime.now(timezone.utc)

        if not already_claimed:

            post.publish_status = "processing"

            post.publish_attempts = (
                post.publish_attempts + 1
            )

            post.publishing_started_at = now

            post.publishing_error = None

            db.commit()

            db.refresh(post)

        campaign = db.scalar(
            select(Campaign).where(
                Campaign.id
                == post.campaign_id,
                Campaign.tenant_id
                == post.tenant_id,
            )
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
            )

        publishing_service = (
            CampaignPostPublishingService(db)
        )

        schedule = (
            publishing_service._build_schedule(
                campaign,
                [post],
                post.tenant_id,
            )
        )

        result = self.publisher.publish(
            schedule
        )

        external_ids = {}

        for published_post in result.posts:

            platform = getattr(
                published_post,
                "platform",
                None,
            )

            external_id = getattr(
                published_post,
                "external_id",
                None,
            )

            if platform and external_id:
                external_ids[platform] = external_id

        post.external_ids = external_ids

        if result.failed == 0:

            post.publish_status = "published"

            post.published_at = now

            post.publishing_started_at = None

            post.next_retry_at = None

            post.publishing_error = None

            db.commit()

            return result

        error = (
            "One or more publishing targets "
            "failed."
        )

        self._handle_failure(
            db,
            post,
            ValueError(error),
            now,
            external_ids=external_ids,
        )

        return result

    def _handle_failure(
        self,
        db,
        post,
        exc: Exception,
        now: datetime,
        *,
        external_ids=None,
    ):

        if external_ids is not None:
            post.external_ids = external_ids

        error = str(exc)

        post.publishing_error = error

        post.publishing_started_at = None

        if (
            post.publish_attempts
            >= post.max_publish_attempts
        ):

            post.publish_status = "failed"

            post.next_retry_at = None

        else:

            post.publish_status = "pending"

            retry_index = max(
                post.publish_attempts - 1,
                0,
            )

            if retry_index >= len(
                self.RETRY_DELAYS
            ):
                retry_index = (
                    len(self.RETRY_DELAYS) - 1
                )

            post.next_retry_at = (
                now
                + self.RETRY_DELAYS[
                    retry_index
                ]
            )

        db.commit()

    @staticmethod
    def _campaign_name(
        db,
        campaign_id: int,
    ) -> str:

        campaign = db.scalar(
            select(Campaign).where(
                Campaign.id == campaign_id,
            )
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
            )

        return campaign.campaign_name