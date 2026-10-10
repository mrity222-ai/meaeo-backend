from __future__ import annotations

from datetime import datetime, time, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    BusinessChannel,
    Campaign,
    CampaignPost,
)
from app.publishers.manager import PublishManager
from app.schemas.schedule import (
    PublishingSchedule,
    ScheduledPost,
)


class CampaignPostPublishingService:

    def __init__(self, db: Session):
        self.db = db
        self.publisher = PublishManager()

    def publish_campaign(
        self,
        context,
        campaign_id,
        execution_mode,
    ):
        campaign = self._get_campaign(
            context,
            campaign_id,
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
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
                "No campaign posts found."
            )

        publishable = (
            self._get_publishable_posts(
                posts,
                execution_mode,
            )
        )

        schedule = self._build_schedule(
            campaign,
            publishable,
            context.tenant_id,
        )

        return self.publisher.publish(
            schedule
        )

    async def apublish_campaign(
        self,
        context,
        campaign_id,
        execution_mode,
    ):
        campaign = self._get_campaign(
            context,
            campaign_id,
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
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
                "No campaign posts found."
            )

        publishable = (
            self._get_publishable_posts(
                posts,
                execution_mode,
            )
        )

        schedule = self._build_schedule(
            campaign,
            publishable,
            context.tenant_id,
        )

        return await self.publisher.apublish(
            schedule
        )

    @staticmethod
    def _get_publishable_posts(
        posts,
        execution_mode,
    ):
        if execution_mode not in {
            "autonomous",
            "human_intervention",
        }:
            raise ValueError(
                "Invalid execution mode."
            )

        publishable = []

        for post in posts:

            if execution_mode == "autonomous":
                publishable.append(post)
                continue

            if post.review_status == "pending":
                raise ValueError(
                    "Campaign contains posts "
                    "awaiting approval."
                )

            if post.review_status == "rejected":
                raise ValueError(
                    "Campaign contains "
                    "rejected posts."
                )

            if post.review_status != "approved":
                raise ValueError(
                    "Campaign contains posts "
                    "that are not approved."
                )

            publishable.append(post)

        return publishable

    def _build_schedule(
        self,
        campaign,
        posts,
        tenant_id,
    ):
        scheduled_posts = []

        business_account_id = (
            campaign.business_account_id
        )

        for post in posts:

            channels = (
                self._resolve_channels_for_post(
                    tenant_id=tenant_id,
                    business_account_id=(
                        business_account_id
                    ),
                    platforms=post.platforms,
                )
            )

            for channel in channels:

                scheduled_for = post.scheduled_for

                if scheduled_for is None:
                    publish_date = (
                        datetime.now(
                            timezone.utc
                        ).date()
                    )

                    publish_time = time(
                        hour=9,
                        minute=0,
                    )
                else:
                    if scheduled_for.tzinfo is None:
                        scheduled_for = (
                            scheduled_for.replace(
                                tzinfo=timezone.utc
                            )
                        )

                    scheduled_for = (
                        scheduled_for.astimezone(
                            timezone.utc
                        )
                    )

                    publish_date = (
                        scheduled_for.date()
                    )

                    publish_time = (
                        scheduled_for.time()
                    )

                scheduled_posts.append(
                    ScheduledPost(
                        campaign_post_id=post.id,
                        day=post.day,
                        business_channel_id=channel.id,
                        publish_date=publish_date,
                        publish_time=publish_time,
                        platforms=[
                            channel.platform
                        ],
                        title=post.title,
                        caption=post.caption,
                        hashtags=post.hashtags,
                        image_path=(
                            post.image_path
                            if post.image_path
                            else ""
                        ),
                        image_url=post.image_url,
                        call_to_action=(
                            post.call_to_action
                        ),
                    )
                )

        return PublishingSchedule(
            campaign_name=campaign.campaign_name,
            tenant_id=tenant_id,
            business_account_id=(
                business_account_id
            ),
            timezone="UTC",
            posts=scheduled_posts,
        )

    def _resolve_channels_for_post(
        self,
        *,
        tenant_id,
        business_account_id,
        platforms,
    ):
        channels = []

        normalized_platforms = [
            platform.strip().lower()
            for platform in platforms
            if platform
        ]

        for platform in normalized_platforms:

            channel = self.db.scalar(
                select(BusinessChannel)
                .where(
                    BusinessChannel.tenant_id
                    == tenant_id,
                    BusinessChannel.business_account_id
                    == business_account_id,
                    BusinessChannel.platform
                    == platform,
                    BusinessChannel.status
                    == "active",
                    BusinessChannel.is_enabled
                    == True,
                )
            )

            if channel is None:
                raise ValueError(
                    "No active enabled business "
                    "channel is connected for "
                    f"platform '{platform}'."
                )

            channels.append(channel)

        return channels

    def _get_campaign(
        self,
        context,
        campaign_id,
    ):
        return self.db.scalar(
            select(Campaign)
            .where(
                Campaign.id == campaign_id,
                Campaign.tenant_id
                == context.tenant_id,
            )
        )