from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    Campaign,
    MarketingPreferences,
)
from app.repositories.campaign_lifecycle_repository import (
    CampaignLifecycleRepository,
)
from app.repositories.business_account_repository import (
    BusinessAccountRepository,
)
from app.security.tenant import TenantContext


class CampaignLifecycleService:

    ALLOWED_EXECUTION_MODES = {
        "autonomous",
        "human_intervention",
    }

    ALLOWED_TRANSITIONS = {
        "draft": {
            "running",
            "cancelled",
        },
        "running": {
            "paused",
            "completed",
            "cancelled",
        },
        "paused": {
            "running",
            "cancelled",
        },
    }

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

        self.repository = (
            CampaignLifecycleRepository(db)
        )

        self.business_accounts = (
            BusinessAccountRepository(db)
        )

    # --------------------------------------------------
    # BUSINESS ACCOUNT VALIDATION
    # --------------------------------------------------

    def _validate_business_account(
        self,
        context: TenantContext,
        business_account_id: int,
    ) -> None:

        if business_account_id <= 0:
            raise ValueError(
                "business_account_id must be positive."
            )

        business_account = (
            self.business_accounts.get_by_id(
                context.tenant_id,
                business_account_id,
            )
        )

        if business_account is None:
            raise ValueError(
                "Business account not found."
            )

        if business_account.status != "active":
            raise ValueError(
                "Business account is not active."
            )

    # --------------------------------------------------
    # GET
    # --------------------------------------------------

    def get(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
    ) -> Campaign | None:

        self._validate_business_account(
            context,
            business_account_id,
        )

        return self.repository.get(
            tenant_id=context.tenant_id,
            business_account_id=business_account_id,
            campaign_id=campaign_id,
        )

    # --------------------------------------------------
    # GET BY NAME
    # --------------------------------------------------

    def get_by_name(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_name: str,
    ) -> Campaign | None:

        self._validate_business_account(
            context,
            business_account_id,
        )

        return self.repository.get_by_name(
            tenant_id=context.tenant_id,
            business_account_id=business_account_id,
            campaign_name=campaign_name,
        )

    # --------------------------------------------------
    # LIST
    # --------------------------------------------------

    def list(
        self,
        context: TenantContext,
        business_account_id: int,
    ) -> list[Campaign]:

        self._validate_business_account(
            context,
            business_account_id,
        )

        return self.repository.list(
            tenant_id=context.tenant_id,
            business_account_id=business_account_id,
        )

    # --------------------------------------------------
    # EXECUTION MODE
    # --------------------------------------------------

    def _resolve_execution_mode(
        self,
        context: TenantContext,
        business_account_id: int,
        execution_mode: str | None,
    ) -> str:

        if execution_mode is not None:

            if (
                execution_mode
                not in self.ALLOWED_EXECUTION_MODES
            ):
                raise ValueError(
                    "Invalid execution mode. "
                    "Expected 'autonomous' or "
                    "'human_intervention'."
                )

            return execution_mode

        preferences = self.db.scalar(
            select(MarketingPreferences).where(
                MarketingPreferences.tenant_id
                == context.tenant_id,
                MarketingPreferences.business_account_id
                == business_account_id,
            )
        )

        if preferences is None:
            return "autonomous"

        mode = preferences.approval_mode

        if mode == "automatic":
            mode = "autonomous"

        elif mode == "approval_required":
            mode = "human_intervention"

        if (
            mode
            not in self.ALLOWED_EXECUTION_MODES
        ):
            return "autonomous"

        return mode

    # --------------------------------------------------
    # CREATE
    # --------------------------------------------------

    def create(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_name: str,
        execution_mode: str | None = None,
    ) -> Campaign:

        self._validate_business_account(
            context,
            business_account_id,
        )

        campaign_name = campaign_name.strip()

        if not campaign_name:
            raise ValueError(
                "Campaign name cannot be empty."
            )

        resolved_mode = (
            self._resolve_execution_mode(
                context,
                business_account_id,
                execution_mode,
            )
        )

        return self.repository.create(
            tenant_id=context.tenant_id,
            business_account_id=business_account_id,
            campaign_name=campaign_name,
            execution_mode=resolved_mode,
            status="draft",
        )

    # --------------------------------------------------
    # STATUS UPDATE
    # --------------------------------------------------
    # --------------------------------------------------
    # STATUS UPDATE
    # --------------------------------------------------

    def update_status(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
        target_status: str,
    ) -> Campaign:

        self._validate_business_account(
            context,
            business_account_id,
        )

        campaign = self.repository.get(
            tenant_id=context.tenant_id,
            business_account_id=business_account_id,
            campaign_id=campaign_id,
        )

        if campaign is None:
            raise ValueError(
                "Campaign not found."
            )

        self._validate_transition(
            campaign.status,
            target_status,
        )

        return self.repository.update_status(
            tenant_id=context.tenant_id,
            business_account_id=business_account_id,
            campaign_id=campaign_id,
            status=target_status,
        )
    # --------------------------------------------------
    # LIFECYCLE ACTIONS
    # --------------------------------------------------

    def start(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
    ) -> Campaign:

        return self.update_status(
            context,
            business_account_id,
            campaign_id,
            "running",
        )

    def resume(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
    ) -> Campaign:

        return self.update_status(
            context,
            business_account_id,
            campaign_id,
            "running",
        )

    def pause(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
    ) -> Campaign:

        return self.update_status(
            context,
            business_account_id,
            campaign_id,
            "paused",
        )

    def complete(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
    ) -> Campaign:

        return self.update_status(
            context,
            business_account_id,
            campaign_id,
            "completed",
        )

    def cancel(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
    ) -> Campaign:

        return self.update_status(
            context,
            business_account_id,
            campaign_id,
            "cancelled",
        )

    # --------------------------------------------------
    # DELETE
    # --------------------------------------------------

    def delete(
        self,
        context: TenantContext,
        business_account_id: int,
        campaign_id: int,
    ) -> None:

        self._validate_business_account(
            context,
            business_account_id,
        )

        self.repository.delete(
            tenant_id=context.tenant_id,
            business_account_id=business_account_id,
            campaign_id=campaign_id,
        )

    # --------------------------------------------------
    # TRANSITION VALIDATION
    # --------------------------------------------------

    @classmethod
    def _validate_transition(
        cls,
        current_status: str,
        target_status: str,
    ) -> None:

        if target_status not in {
            "draft",
            "running",
            "paused",
            "completed",
            "cancelled",
        }:
            raise ValueError(
                f"Invalid campaign status: "
                f"{target_status}"
            )

        allowed = cls.ALLOWED_TRANSITIONS.get(
            current_status,
            set(),
        )

        if target_status not in allowed:
            raise ValueError(
                f"Invalid campaign transition: "
                f"{current_status} -> "
                f"{target_status}"
            )