from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    BusinessAccount,
    BusinessProfile,
)
from app.schemas.business import (
    BusinessProfileCreate,
    BusinessProfileUpdate,
)
from app.security.tenant import TenantContext


class BusinessProfileService:

    def __init__(self, db: Session):
        self.db = db

    def get(
        self,
        context: TenantContext,
        business_account_id: int,
    ) -> BusinessProfile | None:

        return self.db.scalar(
            select(BusinessProfile).where(
                BusinessProfile.tenant_id
                == context.tenant_id,
                BusinessProfile.business_account_id
                == business_account_id,
            )
        )

    def create(
        self,
        context: TenantContext,
        data: BusinessProfileCreate,
    ) -> BusinessProfile:

        business_account_id = data.business_account_id

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
                "Business profile already exists."
            )

        values = data.model_dump(
            exclude={"business_account_id"}
        )

        if values.get("website") is not None:
            values["website"] = str(
                values["website"]
            )

        profile = BusinessProfile(
            tenant_id=context.tenant_id,
            business_account_id=business_account_id,
            **values,
        )

        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)

        return profile

    def update(
        self,
        context: TenantContext,
        business_account_id: int,
        data: BusinessProfileUpdate,
    ) -> BusinessProfile:

        profile = self.get(
            context,
            business_account_id,
        )

        if profile is None:
            raise ValueError(
                "Business profile not found."
            )

        values = data.model_dump(
            exclude_unset=True
        )

        if values.get("website") is not None:
            values["website"] = str(
                values["website"]
            )

        for field, value in values.items():
            setattr(profile, field, value)

        self.db.commit()
        self.db.refresh(profile)

        return profile