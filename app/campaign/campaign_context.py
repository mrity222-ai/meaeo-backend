from dataclasses import dataclass

from app.campaign.brand_adapter import (
    BrandProfileAdapter,
)
from app.campaign.onboarding_context import (
    OnboardingContext,
)
from app.models.brand import (
    BrandProfile as CampaignBrandProfile,
)


@dataclass(frozen=True)
class CampaignContext:

    tenant_id: str

    business_account_id: int

    business: object | None

    brand: CampaignBrandProfile | None

    products: list[object]

    audience: object | None

    marketing_preferences: object | None


class CampaignContextBuilder:

    @staticmethod
    def build(
        onboarding: OnboardingContext,
    ) -> CampaignContext:

        if onboarding.business is None:
            raise ValueError("Business profile is required. Complete business onboarding before executing a campaign.")
        if onboarding.brand is None:
            raise ValueError("Brand profile is required. Complete brand onboarding before executing a campaign.")
        for profile in (onboarding.business, onboarding.brand):
            if (profile.tenant_id != onboarding.tenant_id
                    or profile.business_account_id != onboarding.business_account_id):
                raise ValueError("Campaign context does not belong to the selected business.")
        for profile, fields in (
            (onboarding.business, ("business_name", "category", "description", "country")),
            (onboarding.brand, ("brand_name", "industry", "tone")),
        ):
            missing = [field for field in fields if not str(getattr(profile, field, None) or "").strip()]
            if missing:
                raise ValueError("Complete onboarding fields before executing a campaign: " + ", ".join(missing) + ".")

        campaign_brand = None

        if onboarding.brand is not None:

            campaign_brand = (
                BrandProfileAdapter
                .to_campaign_brand(
                    onboarding.brand
                )
            )

        return CampaignContext(
            tenant_id=onboarding.tenant_id,
            business_account_id=(
                onboarding.business_account_id
            ),
            business=onboarding.business,
            brand=campaign_brand,
            products=onboarding.products,
            audience=onboarding.audience,
            marketing_preferences=(
                onboarding.marketing_preferences
            ),
        )