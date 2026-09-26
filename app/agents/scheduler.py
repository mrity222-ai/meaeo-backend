from __future__ import annotations

from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from app.agents.task import BaseTaskAgent
from sqlalchemy import select

from app.database.models import BusinessChannel
from app.database.session import SessionLocal
from app.graph.state import AgentState
from app.services.asset_service import AssetService
from app.schemas.campaign_spec import CampaignSpec
from app.schemas.content import ContentPlan, ContentPost
from app.schemas.image import GeneratedImage, ImagePlan
from app.schemas.schedule import (
    PublishingSchedule,
    ScheduledPost,
)
from app.schemas.frequency import FrequencyConfig
from app.services.frequency_calculator import FrequencyCalculator


class SchedulerAgent(BaseTaskAgent):

    frequency_calculator = FrequencyCalculator()

    VALID_EXECUTION_MODES = {
        "autonomous",
        "human_intervention",
    }

    def invoke(
        self,
        state: AgentState,
    ) -> AgentState:

        self._require(
            state,
            "campaign",
            "content",
            "image_plan",
        )

        tenant_id = state.get("tenant_id")

        if not tenant_id:
            raise ValueError(
                "tenant_id is required for production scheduling."
            )

        business_account_id = state.get(
            "business_account_id"
        )

        if not business_account_id:
            raise ValueError(
                "business_account_id is required "
                "for production scheduling."
            )

        execution_mode = state.get(
            "execution_mode",
            "autonomous",
        )

        if execution_mode not in self.VALID_EXECUTION_MODES:
            raise ValueError(
                "Invalid execution mode. "
                "Expected 'autonomous' or "
                "'human_intervention'."
            )

        state["execution_mode"] = execution_mode

        # -------------------------------------------------
        # HUMAN INTERVENTION
        # -------------------------------------------------

        if execution_mode == "human_intervention":

            state[self.get_state_key()] = (
                self._empty_schedule(
                    campaign=state["campaign"],
                    tenant_id=tenant_id,
                    business_account_id=business_account_id,
                )
            )

            state["status"] = "awaiting_approval"

            return state

        # -------------------------------------------------
        # AUTONOMOUS
        # -------------------------------------------------

        campaign_context = state.get(
            "campaign_context"
        )

        marketing_preferences = None

        if campaign_context is not None:
            marketing_preferences = (
                campaign_context.marketing_preferences
            )

        schedule = self._schedule_posts(
            campaign=state["campaign"],
            content=state["content"],
            images=state["image_plan"],
            tenant_id=tenant_id,
            business_account_id=business_account_id,
            marketing_preferences=marketing_preferences,
        )

        state[self.get_state_key()] = schedule

        return state

    async def ainvoke(
        self,
        state: AgentState,
    ) -> AgentState:

        return self.invoke(state)

    @staticmethod
    def _empty_schedule(
        campaign: CampaignSpec,
        tenant_id: str,
        business_account_id: int,
    ) -> PublishingSchedule:

        return PublishingSchedule(
            campaign_name=campaign.campaign_name,
            tenant_id=tenant_id,
            business_account_id=business_account_id,
            timezone=campaign.timezone,
            posts=[],
        )

    def _schedule_posts(
        self,
        campaign: CampaignSpec,
        content: ContentPlan,
        images: ImagePlan,
        tenant_id: str,
        business_account_id: int,
        marketing_preferences=None,
    ) -> PublishingSchedule:

        scheduled_posts = []

        frequency_config = self._build_frequency_config(
            campaign=campaign,
            marketing_preferences=marketing_preferences,
        )

        campaign_timezone = ZoneInfo(
            frequency_config.timezone
        )

        start_date = datetime.now(
            campaign_timezone
        ).date()

        posting_slots = (
            self.frequency_calculator.calculate(
                config=frequency_config,
                start_date=start_date,
                number_of_posts=len(content.posts),
            )
        )

        image_lookup = self._build_image_lookup(
            images
        )

        db = SessionLocal()

        try:

            asset_service = AssetService(db)

            # -------------------------------------------------
            # Every ContentPost must have at least one image.
            #
            # If multiple image variants exist for the same
            # campaign day, preserve every variant as a
            # separate ScheduledPost.
            # -------------------------------------------------

            for index, post in enumerate(
                content.posts
            ):

                post_images = image_lookup.get(
                    post.day,
                    [],
                )

                if not post_images:
                    raise ValueError(
                        "No image found for "
                        f"campaign day {post.day}. "
                        "Every content post requires "
                        "an image before autonomous scheduling."
                    )

                scheduled_datetime = posting_slots[
                    index
                ]

                for image in post_images:

                    for platform in post.platforms:

                        scheduled_posts.append(
                            self._schedule_single_post(
                                campaign=campaign,
                                scheduled_datetime=scheduled_datetime,
                                post=post,
                                image=image,
                                platform=platform,
                                tenant_id=tenant_id,
                                business_account_id=business_account_id,
                                asset_service=asset_service,
                            )
                        )

            # -------------------------------------------------
            # Final consistency check.
            # -------------------------------------------------

            content_days = {
                post.day
                for post in content.posts
            }

            scheduled_days = {
                post.day
                for post in scheduled_posts
            }

            missing_days = (
                content_days - scheduled_days
            )

            if missing_days:
                raise ValueError(
                    "Publishing schedule is missing "
                    "campaign days: "
                    f"{sorted(missing_days)}."
                )

            return PublishingSchedule(
                campaign_name=campaign.campaign_name,
                tenant_id=tenant_id,
                business_account_id=(
                    business_account_id
                ),
                timezone=frequency_config.timezone,
                posts=scheduled_posts,
            )

        finally:
            db.close()

    @staticmethod
    def _resolve_channel(
        db,
        *,
        tenant_id: str,
        business_account_id: int,
        platform: str,
    ) -> BusinessChannel:
        normalized_platform = platform.strip().lower()

        channel = db.scalar(
            select(BusinessChannel)
            .where(
                BusinessChannel.tenant_id == tenant_id,
                BusinessChannel.business_account_id
                == business_account_id,
                BusinessChannel.platform
                == normalized_platform,
                BusinessChannel.status == "active",
                BusinessChannel.is_enabled == True,
            )
        )

        if channel is None:
            channel = db.scalar(
                select(BusinessChannel).where(
                    BusinessChannel.tenant_id == tenant_id,
                    BusinessChannel.business_account_id == business_account_id,
                )
            )
            if channel is None:
                channel = BusinessChannel(
                    id=0,
                    tenant_id=tenant_id,
                    business_account_id=business_account_id,
                    platform=normalized_platform,
                    external_account_id="pending_connection",
                    account_name="Pending Connection",
                    status="active",
                    is_enabled=True,
                )

        return channel

    @staticmethod
    def _build_image_lookup(
        images: ImagePlan,
    ) -> dict[int, list[GeneratedImage]]:

        lookup: dict[
            int,
            list[GeneratedImage],
        ] = {}

        for image in images.images:

            lookup.setdefault(
                image.day,
                [],
            ).append(image)

        return lookup

    def _resolve_asset(
        self,
        image: GeneratedImage,
        tenant_id: str,
        business_account_id: int,
        asset_service: AssetService,
    ):

        # -------------------------------------------------
        # Existing registered asset
        # -------------------------------------------------

        if image.asset_id:

            asset = asset_service.get_asset(
                tenant_id=tenant_id,
                business_account_id=(
                    business_account_id
                ),
                asset_id=image.asset_id,
            )

            if asset is None:
                raise ValueError(
                    f"Asset '{image.asset_id}' does not "
                    "belong to Business Account "
                    f"'{business_account_id}' or is unavailable."
                )

            return asset

        # -------------------------------------------------
        # Generated/catalogue file
        # -------------------------------------------------

        image_path = Path(
            image.image_path
        )

        if not image_path.exists():
            raise FileNotFoundError(
                "Image file does not exist: "
                f"{image.image_path}"
            )

        asset = asset_service.register_file(
            tenant_id=tenant_id,
            business_account_id=(
                business_account_id
            ),
            source_path=image_path,
            source=image.source.value,
        )

        image.asset_id = asset.id

        return asset

    @staticmethod
    def _build_frequency_config(
        campaign: CampaignSpec,
        marketing_preferences=None,
    ) -> FrequencyConfig:

        if marketing_preferences is None:

            return FrequencyConfig(
                frequency_type="daily",
                posting_time=(
                    campaign.preferred_posting_time
                ),
                timezone=campaign.timezone,
            )

        posting_frequency = (
            marketing_preferences.posting_frequency
        )

        if posting_frequency == "daily":

            return FrequencyConfig(
                frequency_type="daily",
                posting_time=(
                    marketing_preferences.preferred_posting_time
                ),
                timezone=(
                    marketing_preferences.timezone
                ),
            )

        if posting_frequency == "weekdays":

            return FrequencyConfig(
                frequency_type="weekly",
                posts_per_week=5,
                days_of_week=[
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                ],
                posting_time=(
                    marketing_preferences.preferred_posting_time
                ),
                timezone=(
                    marketing_preferences.timezone
                ),
            )

        if posting_frequency == "three_times_per_week":

            return FrequencyConfig(
                frequency_type="weekly",
                posts_per_week=3,
                days_of_week=[
                    "monday",
                    "wednesday",
                    "friday",
                ],
                posting_time=(
                    marketing_preferences.preferred_posting_time
                ),
                timezone=(
                    marketing_preferences.timezone
                ),
            )

        if posting_frequency == "custom":

            custom_config = (
                marketing_preferences
                .posting_frequency_config
            )

            if custom_config is None:
                raise ValueError(
                    "posting_frequency_config is required "
                    "when posting_frequency is 'custom'."
                )

            return custom_config

        raise ValueError(
            "Unsupported posting frequency: "
            f"{posting_frequency}"
        )

    def _schedule_single_post(
        self,
        campaign: CampaignSpec,
        scheduled_datetime: datetime,
        post: ContentPost,
        image: GeneratedImage,
        platform: str,
        tenant_id: str,
        business_account_id: int,
        asset_service: AssetService,
    ) -> ScheduledPost:

        publish_date = scheduled_datetime.date()

        publish_time = scheduled_datetime.timetz()

        asset = self._resolve_asset(
            image=image,
            tenant_id=tenant_id,
            business_account_id=business_account_id,
            asset_service=asset_service,
        )

        normalized_platform = platform.strip().lower()

        if not normalized_platform:
            raise ValueError(
                f"Campaign day {post.day} contains an empty publishing platform."
            )

        asset_service.reserve_usage(
            asset=asset,
            campaign_name=campaign.campaign_name,
            day=post.day,
            platform=normalized_platform,
        )

        image_url = asset_service.build_signed_url(
            asset,
            ttl_seconds=6 * 60 * 60,
        )

        channel = self._resolve_channel(
            db=asset_service.db,
            tenant_id=tenant_id,
            business_account_id=business_account_id,
            platform=normalized_platform,
        )

        return ScheduledPost(
            day=post.day,
            business_channel_id=channel.id,
            publish_date=publish_date,
            publish_time=publish_time,
            platforms=[normalized_platform],
            title=post.title,
            caption=post.caption,
            hashtags=post.hashtags,
            image_path=image.image_path,
            image_url=image_url,
            image_source=image.source,
            call_to_action=post.call_to_action,
        )

    def get_state_key(self) -> str:
        return "schedule"