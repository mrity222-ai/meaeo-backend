from datetime import datetime, timezone

from sqlalchemy import select

from app.campaign.builder import CampaignBuilder
from app.database.models import Campaign
from app.database.session import SessionLocal
from app.repositories.campaign_repository import (
    CampaignRepository,
)


class CampaignManager:

    def __init__(self):

        self.builder = CampaignBuilder()

        self.repository = CampaignRepository()

    def build(
        self,
        state,
    ):

        return self.builder.build(
            state
        )

    def save(
        self,
        state,
    ):

        tenant_id = state.get(
            "tenant_id"
        )

        if not tenant_id:
            raise ValueError(
                "tenant_id is required for "
                "campaign persistence."
            )

        business_account_id = state.get(
            "business_account_id"
        )

        if not business_account_id:
            raise ValueError(
                "business_account_id is required "
                "for campaign persistence."
            )

        bundle = self.build(
            state
        )

        # ---------------------------------------------
        # Legacy filesystem persistence
        #
        # Keep this temporarily because existing
        # persistence tests and compatibility code
        # still use CampaignRepository.
        # ---------------------------------------------

        self.repository.save(
            tenant_id,
            bundle,
        )

        # ---------------------------------------------
        # Authoritative SQL campaign persistence
        # ---------------------------------------------

        campaign_spec = state.get(
            "campaign"
        )

        if campaign_spec is None:
            raise ValueError(
                "Campaign state is missing."
            )

        campaign_name = (
            campaign_spec.campaign_name
        )

        execution_mode = state.get(
            "execution_mode",
            "autonomous",
        )

        requested_campaign_id = state.get(
            "campaign_id"
        )

        db = SessionLocal()

        try:

            # -----------------------------------------
            # Existing campaign execution
            #
            # When the lifecycle API is executing an
            # existing campaign, campaign_id is the
            # authoritative identity.
            # -----------------------------------------

            if requested_campaign_id is not None:

                campaign = db.scalar(
                    select(Campaign).where(
                        Campaign.id
                        == requested_campaign_id,
                        Campaign.tenant_id
                        == tenant_id,
                        Campaign.business_account_id
                        == business_account_id,
                    )
                )

                if campaign is None:
                    raise ValueError(
                        "Persisted campaign was not found "
                        "for the specified business account."
                    )

            # -----------------------------------------
            # New campaign creation
            #
            # Preserve the existing graph behavior when
            # no campaign_id was supplied.
            # -----------------------------------------

            else:

                campaign = db.scalar(
                    select(Campaign).where(
                        Campaign.tenant_id
                        == tenant_id,
                        Campaign.business_account_id
                        == business_account_id,
                        Campaign.campaign_name
                        == campaign_name,
                    )
                )

            now = datetime.now(
                timezone.utc
            )

            # -----------------------------------------
            # Create campaign if it does not exist
            # -----------------------------------------

            if campaign is None:

                campaign = Campaign(
                    tenant_id=tenant_id,
                    business_account_id=(
                        business_account_id
                    ),
                    campaign_name=campaign_name,
                    execution_mode=(
                        execution_mode
                    ),
                    status=(
                        "draft"
                        if execution_mode
                        == "human_intervention"
                        else "running"
                    ),
                    started_at=(
                        now
                        if execution_mode
                        == "autonomous"
                        else None
                    ),
                )

                db.add(
                    campaign
                )

            # -----------------------------------------
            # Update existing campaign
            # -----------------------------------------

            else:

                campaign.business_account_id = (
                    business_account_id
                )

                campaign.execution_mode = (
                    execution_mode
                )

                campaign.status = (
                    "draft"
                    if execution_mode
                    == "human_intervention"
                    else "running"
                )

                if (
                    campaign.status == "running"
                    and campaign.started_at is None
                ):
                    campaign.started_at = now

                campaign.updated_at = now

            # -----------------------------------------
            # Persist campaign
            # -----------------------------------------

            db.commit()

            db.refresh(
                campaign
            )

            # -----------------------------------------
            # Authoritative ID for downstream
            # CampaignPost persistence.
            # -----------------------------------------

            state["campaign_id"] = (
                campaign.id
            )

        except Exception:

            db.rollback()

            raise

        finally:

            db.close()

        return bundle

    def load(
        self,
        tenant_id: str,
        campaign_name: str,
    ):

        return self.repository.load(
            tenant_id,
            campaign_name,
        )