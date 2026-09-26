from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    BusinessAccount,
    Campaign,
    CampaignPost,
)
from app.security.tenant import TenantContext


class CampaignPostService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def list_posts(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
    ) -> list[CampaignPost]:

        campaign = self._get_campaign(
            context,
            business_account_id,
            campaign_id,
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
            )

        return list(
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

    def get(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
        post_id: int,
    ) -> CampaignPost | None:

        campaign = self._get_campaign(
            context,
            business_account_id,
            campaign_id,
        )

        if campaign is None:
            return None

        return self.db.scalar(
            select(CampaignPost)
            .where(
                CampaignPost.id == post_id,
                CampaignPost.campaign_id
                == campaign_id,
                CampaignPost.tenant_id
                == context.tenant_id,
            )
        )

    def create(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
        data: dict,
    ) -> CampaignPost:

        campaign = self._get_campaign(
            context,
            business_account_id,
            campaign_id,
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
            )

        post = CampaignPost(
            campaign_id=campaign_id,
            tenant_id=context.tenant_id,
            **data,
        )

        self.db.add(post)

        try:
            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        self.db.refresh(post)

        return post

    def create_from_content(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
        content,
    ) -> list[CampaignPost]:

        campaign = self._get_campaign(
            context,
            business_account_id,
            campaign_id,
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
            )

        existing = list(
            self.db.scalars(
                select(CampaignPost).where(
                    CampaignPost.campaign_id
                    == campaign_id,
                    CampaignPost.tenant_id
                    == context.tenant_id,
                )
            ).all()
        )

        if existing:
            return existing

        created = []

        for content_post in content.posts:

            post = CampaignPost(
                campaign_id=campaign_id,
                tenant_id=context.tenant_id,
                day=content_post.day,
                platforms=content_post.platforms,
                objective=content_post.objective,
                content_pillar=content_post.content_pillar,
                title=content_post.title,
                caption=content_post.caption,
                hashtags=content_post.hashtags,
                image_prompt=content_post.image_prompt,
                call_to_action=content_post.call_to_action,
                visual_theme=content_post.visual_theme,
                asset_tags=content_post.asset_tags,
                review_status="pending",
            )

            self.db.add(post)
            created.append(post)

        try:
            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        for post in created:
            self.db.refresh(post)

        return created

    def create_from_content_and_schedule(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
        content,
        schedule,
    ) -> list[CampaignPost]:

        campaign = self._get_campaign(
            context,
            business_account_id,
            campaign_id,
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
            )

        existing = list(
            self.db.scalars(
                select(CampaignPost).where(
                    CampaignPost.campaign_id
                    == campaign_id,
                    CampaignPost.tenant_id
                    == context.tenant_id,
                )
            ).all()
        )

        if existing:
            return existing

        schedule_by_day = {
            scheduled_post.day: scheduled_post
            for scheduled_post in schedule.posts
        }

        try:
            schedule_timezone = ZoneInfo(
                schedule.timezone
            )

        except Exception as exc:
            raise ValueError(
                "Invalid schedule timezone: "
                f"{schedule.timezone}"
            ) from exc

        created = []

        for content_post in content.posts:

            scheduled_post = schedule_by_day.get(
                content_post.day
            )

            if scheduled_post is None:
                raise ValueError(
                    "No scheduled post found "
                    f"for campaign day "
                    f"{content_post.day}."
                )

            scheduled_for = datetime.combine(
                scheduled_post.publish_date,
                scheduled_post.publish_time,
            )

            if scheduled_for.tzinfo is None:
                scheduled_for = scheduled_for.replace(
                    tzinfo=schedule_timezone
                )

            scheduled_for = scheduled_for.astimezone(
                timezone.utc
            )

            post = CampaignPost(
                campaign_id=campaign_id,
                tenant_id=context.tenant_id,

                day=content_post.day,
                platforms=content_post.platforms,

                objective=content_post.objective,
                content_pillar=content_post.content_pillar,

                title=content_post.title,
                caption=content_post.caption,
                hashtags=content_post.hashtags,

                image_prompt=content_post.image_prompt,
                call_to_action=content_post.call_to_action,
                visual_theme=content_post.visual_theme,
                asset_tags=content_post.asset_tags,

                image_path=scheduled_post.image_path,
                image_url=scheduled_post.image_url,

                review_status="pending",

                scheduled_for=scheduled_for,
                publish_status="pending",
            )

            self.db.add(post)
            created.append(post)

        try:
            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        for post in created:
            self.db.refresh(post)

        return created

    def schedule_post(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
        post_id: int,
        scheduled_for: datetime,
    ) -> CampaignPost:

        post = self.get(
            context,
            business_account_id,
            campaign_id,
            post_id,
        )

        if post is None:
            raise ValueError(
                "Campaign post not found."
            )

        if scheduled_for.tzinfo is None:
            scheduled_for = scheduled_for.replace(
                tzinfo=timezone.utc
            )

        post.scheduled_for = scheduled_for
        post.publish_status = "pending"
        post.publishing_started_at = None
        post.published_at = None
        post.external_ids = None
        post.publishing_error = None
        post.updated_at = datetime.now(
            timezone.utc
        )

        self.db.commit()
        self.db.refresh(post)

        return post

    def schedule_campaign_posts(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
        scheduled_times: dict[int, datetime],
    ) -> list[CampaignPost]:

        campaign = self._get_campaign(
            context,
            business_account_id,
            campaign_id,
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
            )

        posts = self.list_posts(
            context,
            business_account_id,
            campaign_id,
        )

        for post in posts:

            scheduled_for = scheduled_times.get(
                post.id
            )

            if scheduled_for is None:
                continue

            if scheduled_for.tzinfo is None:
                scheduled_for = scheduled_for.replace(
                    tzinfo=timezone.utc
                )

            post.scheduled_for = scheduled_for
            post.publish_status = "pending"
            post.publishing_started_at = None
            post.published_at = None
            post.external_ids = None
            post.publishing_error = None
            post.updated_at = datetime.now(
                timezone.utc
            )

        self.db.commit()

        for post in posts:
            self.db.refresh(post)

        return posts

    def update(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
        post_id: int,
        values: dict,
    ) -> CampaignPost:

        post = self.get(
            context,
            business_account_id,
            campaign_id,
            post_id,
        )

        if post is None:
            raise ValueError(
                "Campaign post not found."
            )

        if post.review_status != "pending":
            raise ValueError(
                "Only pending posts can be edited."
            )

        for field, value in values.items():

            if value is not None:
                setattr(
                    post,
                    field,
                    value,
                )

        post.updated_at = datetime.now(
            timezone.utc
        )

        self.db.commit()
        self.db.refresh(post)

        return post

    def approve(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
        post_id: int,
    ) -> CampaignPost:

        post = self.get(
            context,
            business_account_id,
            campaign_id,
            post_id,
        )

        if post is None:
            raise ValueError(
                "Campaign post not found."
            )

        if post.review_status != "pending":
            raise ValueError(
                "Only pending posts can be approved."
            )

        post.review_status = "approved"
        post.rejection_reason = None
        post.reviewed_at = datetime.now(
            timezone.utc
        )

        self.db.commit()
        self.db.refresh(post)

        return post

    def reject(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
        post_id: int,
        reason: str | None = None,
    ) -> CampaignPost:

        post = self.get(
            context,
            business_account_id,
            campaign_id,
            post_id,
        )

        if post is None:
            raise ValueError(
                "Campaign post not found."
            )

        if post.review_status != "pending":
            raise ValueError(
                "Only pending posts can be rejected."
            )

        post.review_status = "rejected"
        post.rejection_reason = reason
        post.reviewed_at = datetime.now(
            timezone.utc
        )

        self.db.commit()
        self.db.refresh(post)

        return post

    def _get_campaign(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
    ) -> Campaign | None:

        business_account = self.db.scalar(
            select(BusinessAccount).where(
                BusinessAccount.id
                == business_account_id,
                BusinessAccount.tenant_id
                == context.tenant_id,
                BusinessAccount.status == "active",
            )
        )

        if business_account is None:
            return None

        return self.db.scalar(
            select(Campaign).where(
                Campaign.id == campaign_id,
                Campaign.tenant_id
                == context.tenant_id,
                Campaign.business_account_id
                == business_account_id,
            )
        )