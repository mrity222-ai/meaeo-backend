from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select

from app.campaign.manager import CampaignManager
from app.database.models import Campaign
from app.database.session import SessionLocal
from app.graph.marketing import MarketingGraph
from app.repositories.business_account_repository import (
    BusinessAccountRepository,
)
from app.security.tenant import TenantContext
from app.services.campaign_post_service import CampaignPostService


class GraphRunner:

    def __init__(self):
        self.graph = MarketingGraph().build()
        self.campaign_manager = CampaignManager()

    def run(self, state):

        # -------------------------------------------------
        # Validate tenant context
        # -------------------------------------------------

        tenant_id = state.get("tenant_id")

        if not tenant_id:
            state["status"] = "failed"

            state.setdefault("errors", []).append(
                "Tenant context is required."
            )

            return state

        # -------------------------------------------------
        # Validate business account context
        # -------------------------------------------------

        business_account_id = state.get(
            "business_account_id"
        )

        if not business_account_id:
            state["status"] = "failed"

            state.setdefault("errors", []).append(
                "Business account context is required."
            )

            return state

        # -------------------------------------------------
        # Validate execution mode
        # -------------------------------------------------

        execution_mode = state.get(
            "execution_mode",
            "autonomous",
        )

        if execution_mode not in {
            "autonomous",
            "human_intervention",
        }:
            state["status"] = "failed"

            state.setdefault("errors", []).append(
                "Invalid execution mode. "
                "Expected 'autonomous' or "
                "'human_intervention'."
            )

            return state

        state["execution_mode"] = execution_mode

        # -------------------------------------------------
        # Preserve existing campaign identity
        #
        # If this runner invocation came from
        # /campaigns/{campaign_id}/execute, the campaign_id
        # already in state identifies the authoritative
        # SQL campaign.
        # -------------------------------------------------

        existing_campaign_id = state.get(
            "campaign_id"
        )

        # -------------------------------------------------
        # Resolve connected publishing platforms
        # -------------------------------------------------

        db = SessionLocal()

        try:
            repository = BusinessAccountRepository(
                db
            )

            channels = repository.list_channels(
                tenant_id=tenant_id,
                business_account_id=business_account_id,
            )

            available_platforms = [
                channel.platform
                for channel in channels
                if channel.status == "active"
                and channel.is_enabled
                and channel.platform
            ]

        finally:
            db.close()

        if not available_platforms:
            # Fallback to default platforms for unconnected trial/preview generation
            available_platforms = ["instagram", "facebook"]

        state["available_platforms"] = (
            available_platforms
        )

        # -------------------------------------------------
        # Generate campaign
        # -------------------------------------------------

        try:
            state = self.graph.invoke(
                state
            )

        except Exception as exc:
            state["status"] = "failed"

            state.setdefault("errors", []).append(
                "Campaign graph execution failed: "
                f"{exc}"
            )

            return state

        if state.get("status") == "failed":
            return state

        # -------------------------------------------------
        # Restore existing campaign identity if the graph
        # replaced or removed it.
        # -------------------------------------------------

        if existing_campaign_id is not None:
            state["campaign_id"] = (
                existing_campaign_id
            )

        # -------------------------------------------------
        # Validate generated campaign
        # -------------------------------------------------

        campaign = state.get("campaign")

        if campaign is None:
            state["status"] = "failed"

            state.setdefault("errors", []).append(
                "Campaign state is missing."
            )

            return state

        content = state.get("content")

        if content is None:
            state["status"] = "failed"

            state.setdefault("errors", []).append(
                "Generated content plan is missing."
            )

            return state

        schedule = state.get("schedule")

        if schedule is None:
            state["status"] = "failed"

            state.setdefault("errors", []).append(
                "Generated publishing schedule is missing."
            )

            return state

        # -------------------------------------------------
        # Persist campaign bundle
        # -------------------------------------------------

        try:
            bundle = self.campaign_manager.save(
                state
            )

        except Exception as exc:
            state["status"] = "failed"

            state.setdefault("errors", []).append(
                "Campaign persistence failed: "
                f"{exc}"
            )

            return state

        state["campaign_bundle"] = bundle

        # -------------------------------------------------
        # Persist SQL campaign + campaign posts
        #
        # The campaign repository stores the campaign
        # bundle. The SQL campaign/post records represent
        # execution state used by scheduling, publishing,
        # pause/resume and CRUD.
        # -------------------------------------------------

        db = SessionLocal()

        try:
            campaign_id = state.get(
                "campaign_id"
            )

            if campaign_id is None:
                raise ValueError(
                    "Persisted campaign ID is missing."
                )

            campaign_record = db.scalar(
                select(Campaign).where(
                    Campaign.id == campaign_id,
                    Campaign.tenant_id == tenant_id,
                    Campaign.business_account_id
                    == business_account_id,
                )
            )

            if campaign_record is None:
                raise ValueError(
                    "Persisted campaign was not found "
                    "for the specified business account."
                )

            # -------------------------------------------------
            # Create SQL campaign posts
            # -------------------------------------------------

            service = CampaignPostService(
                db
            )

            posts = service.create_from_content(
                TenantContext(
                    tenant_id=tenant_id,
                ),
                business_account_id,
                campaign_record.id,
                content,
            )

            if not posts:
                raise ValueError(
                    "No campaign posts were generated."
                )

            # -------------------------------------------------
            # Build schedule lookup
            # -------------------------------------------------

            schedule_by_day = {
                scheduled_post.day: scheduled_post
                for scheduled_post in schedule.posts
            }

            if not schedule_by_day:
                raise ValueError(
                    "Publishing schedule contains no posts."
                )

            # -------------------------------------------------
            # Synchronize generated schedule with SQL posts
            # -------------------------------------------------

            for campaign_post in posts:

                scheduled_post = schedule_by_day.get(
                    campaign_post.day
                )

                if scheduled_post is None:
                    raise ValueError(
                        "No scheduled post found "
                        f"for campaign day "
                        f"{campaign_post.day}."
                    )

                scheduled_datetime = datetime.combine(
                    scheduled_post.publish_date,
                    scheduled_post.publish_time,
                )

                # SchedulerAgent creates the datetime
                # in the campaign timezone. Persist it
                # as timezone-aware UTC.
                try:
                    campaign_timezone = ZoneInfo(
                        schedule.timezone
                    )

                    scheduled_datetime = (
                        scheduled_datetime
                        .replace(
                            tzinfo=campaign_timezone
                        )
                        .astimezone(timezone.utc)
                    )

                except Exception:
                    scheduled_datetime = (
                        scheduled_datetime.replace(
                            tzinfo=timezone.utc
                        )
                    )

                campaign_post.scheduled_for = (
                    scheduled_datetime
                )

                campaign_post.publish_status = (
                    "pending"
                )

                campaign_post.image_path = (
                    scheduled_post.image_path
                )

                campaign_post.image_url = (
                    scheduled_post.image_url
                )

            # -------------------------------------------------
            # Persist campaign posts
            # -------------------------------------------------

            db.commit()

            for campaign_post in posts:
                db.refresh(
                    campaign_post
                )

            state["campaign_posts"] = posts

            state["campaign_id"] = (
                campaign_record.id
            )

            # -------------------------------------------------
            # Autonomous execution
            #
            # V1 autonomous mode prepares the campaign and
            # leaves publishing to the background scheduler/
            # worker once scheduled_for is reached.
            # -------------------------------------------------

            if execution_mode == "autonomous":

                campaign_record.status = (
                    "running"
                )

                if campaign_record.started_at is None:
                    campaign_record.started_at = (
                        datetime.now(
                            timezone.utc
                        )
                    )

                db.commit()

                state["status"] = "success"

            # -------------------------------------------------
            # Human intervention
            #
            # Posts remain pending until approved.
            # -------------------------------------------------

            else:

                campaign_record.status = (
                    "awaiting_approval"
                )

                db.commit()

                state["status"] = (
                    "awaiting_approval"
                )

        except Exception as exc:

            db.rollback()

            state["status"] = "failed"

            state.setdefault("errors", []).append(
                "Campaign execution persistence "
                f"failed: {exc}"
            )

            return state

        finally:
            db.close()

        return state