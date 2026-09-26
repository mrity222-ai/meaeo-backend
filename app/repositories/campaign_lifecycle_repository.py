from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import Campaign


class CampaignLifecycleRepository:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def get(
        self,
        tenant_id: str,
        business_account_id: int,
        campaign_id: int,
    ) -> Campaign | None:

        return self.db.scalar(
            select(Campaign).where(
                Campaign.id == campaign_id,
                Campaign.tenant_id == tenant_id,
                Campaign.business_account_id
                == business_account_id,
            )
        )

    def get_by_name(
        self,
        tenant_id: str,
        business_account_id: int,
        campaign_name: str,
    ) -> Campaign | None:

        return self.db.scalar(
            select(Campaign).where(
                Campaign.tenant_id == tenant_id,
                Campaign.business_account_id
                == business_account_id,
                Campaign.campaign_name
                == campaign_name,
            )
        )

    def list(
        self,
        tenant_id: str,
        business_account_id: int,
    ) -> list[Campaign]:

        return list(
            self.db.scalars(
                select(Campaign)
                .where(
                    Campaign.tenant_id == tenant_id,
                    Campaign.business_account_id
                    == business_account_id,
                )
                .order_by(
                    Campaign.created_at.desc()
                )
            ).all()
        )

    def create(
        self,
        tenant_id: str,
        business_account_id: int,
        campaign_name: str,
        execution_mode: str,
        status: str = "draft",
    ) -> Campaign:

        existing = self.get_by_name(
            tenant_id=tenant_id,
            business_account_id=business_account_id,
            campaign_name=campaign_name,
        )

        if existing is not None:
            raise ValueError(
                "A campaign with this name "
                "already exists."
            )

        campaign = Campaign(
            tenant_id=tenant_id,
            business_account_id=business_account_id,
            campaign_name=campaign_name,
            execution_mode=execution_mode,
            status=status,
        )

        self.db.add(campaign)
        self.db.commit()
        self.db.refresh(campaign)

        return campaign

    def update_status(
        self,
        tenant_id: str,
        business_account_id: int,
        campaign_id: int,
        status: str,
    ) -> Campaign:

        campaign = self.get(
            tenant_id=tenant_id,
            business_account_id=business_account_id,
            campaign_id=campaign_id,
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
            )

        now = datetime.now(timezone.utc)

        campaign.status = status
        campaign.updated_at = now

        if status == "running":
            campaign.started_at = (
                campaign.started_at or now
            )

        elif status == "paused":
            campaign.paused_at = now

        elif status == "completed":
            campaign.completed_at = now

        elif status == "cancelled":
            campaign.cancelled_at = now

        self.db.commit()
        self.db.refresh(campaign)

        return campaign

    def delete(
        self,
        tenant_id: str,
        business_account_id: int,
        campaign_id: int,
    ) -> None:

        campaign = self.get(
            tenant_id=tenant_id,
            business_account_id=business_account_id,
            campaign_id=campaign_id,
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
            )

        self.db.delete(campaign)
        self.db.commit()