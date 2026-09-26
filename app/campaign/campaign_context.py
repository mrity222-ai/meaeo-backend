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