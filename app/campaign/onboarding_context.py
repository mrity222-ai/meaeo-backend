from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    BusinessAccount,
    BusinessProfile,
    BrandProfile,
    Product,
    TargetAudience,
    MarketingPreferences,
)
from app.security.tenant import TenantContext


@dataclass(frozen=True)
class OnboardingContext:

    tenant_id: str

    business_account_id: int

    business_account: BusinessAccount

    business: BusinessProfile | None
    brand: BrandProfile | None
    products: list[Product]
    audience: TargetAudience | None
    marketing_preferences: (
        MarketingPreferences | None
    )


class OnboardingContextService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def load(
        self,
        context: TenantContext,
        business_account_id: int,
    ) -> OnboardingContext:

        tenant_id = context.tenant_id

        if business_account_id <= 0:
            raise ValueError(
                "business_account_id must be positive."
            )

        business_account = self.db.scalar(
            select(BusinessAccount).where(
                BusinessAccount.id == business_account_id,
                BusinessAccount.tenant_id == tenant_id,
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

        business = self.db.scalar(
            select(BusinessProfile).where(
                BusinessProfile.tenant_id == tenant_id,
                BusinessProfile.business_account_id
                == business_account_id,
            )
        )

        brand = self.db.scalar(
            select(BrandProfile).where(
                BrandProfile.tenant_id == tenant_id,
                BrandProfile.business_account_id
                == business_account_id,
            )
        )

        products = list(
            self.db.scalars(
                select(Product)
                .where(
                    Product.tenant_id == tenant_id,
                    Product.business_account_id
                    == business_account_id,
                )
                .order_by(Product.id)
            ).all()
        )

        audience = self.db.scalar(
            select(TargetAudience).where(
                TargetAudience.tenant_id == tenant_id,
                TargetAudience.business_account_id
                == business_account_id,
            )
        )

        marketing_preferences = self.db.scalar(
            select(MarketingPreferences).where(
                MarketingPreferences.tenant_id
                == tenant_id,
                MarketingPreferences.business_account_id
                == business_account_id,
            )
        )

        return OnboardingContext(
            tenant_id=tenant_id,
            business_account_id=business_account_id,
            business_account=business_account,
            business=business,
            brand=brand,
            products=products,
            audience=audience,
            marketing_preferences=marketing_preferences,
        )