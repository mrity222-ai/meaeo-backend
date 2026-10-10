from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    BusinessAccount,
    BrandProfile,
)
from app.schemas.brand import (
    BrandProfileCreate,
    BrandProfileUpdate,
)
from app.security.tenant import TenantContext
from app.services.asset_service import AssetService


class BrandProfileService:

    def __init__(self, db: Session):
        self.db = db

    def get(
        self,
        context: TenantContext,
        business_account_id: int,
    ) -> BrandProfile | None:

        return self.db.scalar(
            select(BrandProfile).where(
                BrandProfile.tenant_id
                == context.tenant_id,
                BrandProfile.business_account_id
                == business_account_id,
            )
        )

    def create(
        self,
        context: TenantContext,
        data: BrandProfileCreate,
    ) -> BrandProfile:

        values = data.model_dump()

        business_account_id = values[
            "business_account_id"
        ]

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
                "Brand profile already exists."
            )

        if values.get("logo_asset_id"):
            AssetService(self.db).resolve_owned_image_path(
                tenant_id=context.tenant_id, business_account_id=business_account_id,
                asset_id=values["logo_asset_id"])

        profile = BrandProfile(
            tenant_id=context.tenant_id,
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
        data: BrandProfileUpdate,
    ) -> BrandProfile:

        profile = self.get(
            context,
            business_account_id,
        )

        if profile is None:
            raise ValueError(
                "Brand profile not found."
            )

        values = data.model_dump(
            exclude_unset=True
        )

        assets = AssetService(self.db)
        assets.validate_business_account_access(tenant_id=context.tenant_id, business_account_id=business_account_id)
        if values.get("logo_asset_id"):
            assets.resolve_owned_image_path(tenant_id=context.tenant_id,
                business_account_id=business_account_id, asset_id=values["logo_asset_id"])

        for field, value in values.items():
            setattr(profile, field, value)

        self.db.commit()
        self.db.refresh(profile)

        return profile