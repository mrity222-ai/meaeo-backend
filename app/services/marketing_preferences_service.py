from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    BusinessAccount,
    MarketingPreferences,
)
from app.schemas.marketing_preferences import (
    MarketingPreferencesCreate,
    MarketingPreferencesUpdate,
)
from app.security.tenant import TenantContext


class MarketingPreferencesService:

    def __init__(self, db: Session):
        self.db = db

    def get(
        self,
        context: TenantContext,
        business_account_id: int,
    ) -> MarketingPreferences | None:

        return self.db.scalar(
            select(MarketingPreferences).where(
                MarketingPreferences.tenant_id
                == context.tenant_id,
                MarketingPreferences.business_account_id
                == business_account_id,
            )
        )

    def create(
        self,
        context: TenantContext,
        data: MarketingPreferencesCreate,
    ) -> MarketingPreferences:

        business_account_id = (
            data.business_account_id
        )

        business_account = self.db.scalar(
            select(BusinessAccount).where(
                BusinessAccount.id
                == business_account_id,
                BusinessAccount.tenant_id
                == context.tenant_id,
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

        existing = self.get(
            context,
            business_account_id,
        )

        if existing is not None:
            raise ValueError(
                "Marketing preferences already exist."
            )

        values = data.model_dump(
            exclude={"business_account_id"}
        )

        preferences = MarketingPreferences(
            tenant_id=context.tenant_id,
            business_account_id=business_account_id,
            **values,
        )

        self.db.add(preferences)
        self.db.commit()
        self.db.refresh(preferences)

        return preferences

    def update(
        self,
        context: TenantContext,
        business_account_id: int,
        data: MarketingPreferencesUpdate,
    ) -> MarketingPreferences:

        preferences = self.get(
            context,
            business_account_id,
        )

        if preferences is None:
            raise ValueError(
                "Marketing preferences not found."
            )

        values = data.model_dump(
            exclude_unset=True
        )

        for field, value in values.items():
            setattr(
                preferences,
                field,
                value,
            )

        self.db.commit()
        self.db.refresh(preferences)

        return preferences