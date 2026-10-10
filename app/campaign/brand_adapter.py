from app.database.models import (
    BrandProfile as DatabaseBrandProfile,
)

from app.models.brand import (
    BrandProfile as CampaignBrandProfile,
)


class BrandProfileAdapter:

    @staticmethod
    def to_campaign_brand(
        brand: DatabaseBrandProfile,
    ) -> CampaignBrandProfile:

        voice = {
            "tone": brand.tone,
        }

        if brand.custom_voice:
            voice["custom_voice"] = (
                brand.custom_voice
            )

        contact_details = {}

        if brand.phone:
            contact_details["phone"] = (
                brand.phone
            )

        if brand.whatsapp:
            contact_details["whatsapp"] = (
                brand.whatsapp
            )

        if brand.email:
            contact_details["email"] = (
                brand.email
            )

        if brand.address:
            contact_details["address"] = (
                brand.address
            )

        metadata = {
            "brand_description": (
                brand.brand_description
            ),
            "industry": brand.industry,
            "tenant_id": brand.tenant_id,
            "business_account_id": (
                brand.business_account_id
            ),
        }

        if brand.logo_asset_id:
            metadata["logo_asset_id"] = (
                brand.logo_asset_id
            )

        return CampaignBrandProfile(
            name=brand.brand_name,
            primary_color=brand.primary_color or "",
            secondary_color=brand.secondary_color or "",
            fonts={},
            voice=voice,
            hashtags=[],
            products=[],
            logos={"primary": brand.logo_asset_id} if brand.logo_asset_id else {},
            templates={},
            visual={},
            website=brand.website or "",
            contact_details=contact_details,
            logo_position=brand.logo_position or "upper_right",
            contact_position=brand.contact_position or "lower_right",
            metadata=metadata,
        )
