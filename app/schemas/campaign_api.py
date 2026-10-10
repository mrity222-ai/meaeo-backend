from pydantic import BaseModel, Field, field_validator
from app.schemas.image import ImageStrategy, ImageSourceMode


class CampaignImageRequest(BaseModel):
    image_strategy: ImageStrategy | None = None

    @field_validator("image_strategy")
    @classmethod
    def supported_image_mode(cls, value):
        if value is not None and value.source_mode == ImageSourceMode.BOTH:
            raise ValueError("Combined catalogue and AI mode is not supported.")
        return value


class CampaignRunRequest(CampaignImageRequest):

    business_account_id: int = Field(
        gt=0,
    )

    user_input: str

    brand_name: str | None = None


class CampaignRunResponse(BaseModel):

    status: str

    tenant_id: str

    business_account_id: int

    campaign_name: str | None = None

    campaign_bundle: dict | None = None

    errors: list[str] = []

    warnings: list[str] = []