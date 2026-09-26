from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import Campaign, CampaignPost
from app.security.tenant import TenantContext


class CampaignScheduleService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def schedule(
        self,
        context: TenantContext,
        campaign_id: int,
        *,
        schedule_type: str,
        delay_minutes: int | None = None,
        scheduled_for: datetime | None = None,
    ) -> list[CampaignPost]:

        campaign = self.db.scalar(
            select(Campaign).where(
                Campaign.id == campaign_id,
                Campaign.tenant_id
                == context.tenant_id,
            )
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
            )

        if campaign.status not in {
            "draft",
            "paused",
            "running",
        }:
            raise ValueError(
                f"Campaign cannot be scheduled "
                f"from status '{campaign.status}'."
            )

        posts = list(
            self.db.scalars(
                select(CampaignPost)
                .where(
                    CampaignPost.campaign_id
                    == campaign_id,
                    CampaignPost.tenant_id
                    == context.tenant_id,
                )
                .order_by(
                    CampaignPost.day,
                    CampaignPost.id,
                )
            ).all()
        )

        if not posts:
            raise ValueError(
                "Campaign has no posts to schedule."
            )

        first_time = self._resolve_first_time(
            schedule_type=schedule_type,
            delay_minutes=delay_minutes,
            scheduled_for=scheduled_for,
        )

        for index, post in enumerate(posts):

            post.scheduled_for = (
                first_time
                + timedelta(days=index)
            )

            post.publish_status = "pending"
            post.publishing_started_at = None
            post.published_at = None
            post.external_ids = None
            post.publishing_error = None

        campaign.status = "running"
        campaign.started_at = (
            campaign.started_at
            or datetime.now(timezone.utc)
        )
        campaign.updated_at = (
            datetime.now(timezone.utc)
        )

        self.db.commit()

        for post in posts:
            self.db.refresh(post)

        return posts

    @staticmethod
    def _resolve_first_time(
        *,
        schedule_type: str,
        delay_minutes: int | None,
        scheduled_for: datetime | None,
    ) -> datetime:

        if schedule_type == "delay":

            if delay_minutes is None:
                raise ValueError(
                    "delay_minutes is required "
                    "for delay scheduling."
                )

            return (
                datetime.now(timezone.utc)
                + timedelta(
                    minutes=delay_minutes
                )
            )

        if schedule_type == "specific_time":

            if scheduled_for is None:
                raise ValueError(
                    "scheduled_for is required "
                    "for specific-time scheduling."
                )

            if scheduled_for.tzinfo is None:
                raise ValueError(
                    "scheduled_for must include "
                    "a timezone."
                )

            return scheduled_for.astimezone(
                timezone.utc
            )

        raise ValueError(
            "Invalid schedule_type."
        )

    def schedule_post(
        self,
        context: TenantContext,
        campaign_id: int,
        post_id: int,
        *,
        schedule_type: str,
        delay_minutes: int | None = None,
        scheduled_for: datetime | None = None,
    ) -> CampaignPost:

        campaign = self.db.scalar(
            select(Campaign).where(
                Campaign.id == campaign_id,
                Campaign.tenant_id == context.tenant_id,
            )
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
            )

        if campaign.status not in {
            "draft",
            "paused",
            "running",
        }:
            raise ValueError(
                f"Campaign cannot be scheduled "
                f"from status '{campaign.status}'."
            )

        post = self.db.scalar(
            select(CampaignPost).where(
                CampaignPost.id == post_id,
                CampaignPost.campaign_id == campaign_id,
                CampaignPost.tenant_id == context.tenant_id,
            )
        )

        if post is None:
            raise ValueError(
                "Campaign post not found."
            )

        first_time = self._resolve_first_time(
            schedule_type=schedule_type,
            delay_minutes=delay_minutes,
            scheduled_for=scheduled_for,
        )

        post.scheduled_for = first_time
        post.publish_status = "pending"
        post.publishing_started_at = None
        post.published_at = None
        post.external_ids = None
        post.publishing_error = None

        campaign.status = "running"
        campaign.started_at = (
            campaign.started_at
            or datetime.now(timezone.utc)
        )
        campaign.updated_at = (
            datetime.now(timezone.utc)
        )

        self.db.commit()

        self.db.refresh(post)

        return post