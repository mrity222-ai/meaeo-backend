from typing import Literal

from pydantic import BaseModel, Field, field_validator


OverlayPosition = Literal[
    "upper_left",
    "upper_middle",
    "upper_right",
    "lower_left",
    "lower_middle",
    "lower_right",
]


DEFAULT_LOGO_POSITION: OverlayPosition = (
    "upper_right"
)

DEFAULT_CONTACT_POSITION: OverlayPosition = (
    "lower_right"
)


LEGACY_POSITION_ALIASES = {
    "top_left": "upper_left",
    "top_center": "upper_middle",
    "top_middle": "upper_middle",
    "top_right": "upper_right",
    "bottom_left": "lower_left",
    "bottom_center": "lower_middle",
    "bottom_middle": "lower_middle",
    "bottom_right": "lower_right",
}


class BrandProfileBase(BaseModel):

    brand_name: str = Field(
        min_length=1,
        max_length=255,
    )

    brand_description: str | None = Field(
        default=None,
        max_length=5000,
    )

    industry: str = Field(
        min_length=1,
        max_length=255,
    )

    tone: str = Field(
        min_length=1,
        max_length=255,
    )

    custom_voice: str | None = Field(
        default=None,
        max_length=5000,
    )

    primary_color: str | None = Field(
        default=None,
        max_length=32,
    )

    secondary_color: str | None = Field(
        default=None,
        max_length=32,
    )

    logo_asset_id: str | None = None

    website: str | None = Field(
        default=None,
        max_length=2048,
    )

    phone: str | None = Field(
        default=None,
        max_length=64,
    )

    whatsapp: str | None = Field(
        default=None,
        max_length=64,
    )

    email: str | None = Field(
        default=None,
        max_length=320,
    )

    address: str | None = Field(
        default=None,
        max_length=2048,
    )

    logo_position: OverlayPosition = (
        DEFAULT_LOGO_POSITION
    )

    contact_position: OverlayPosition = (
        DEFAULT_CONTACT_POSITION
    )


class BrandProfileCreate(
    BrandProfileBase
):

    business_account_id: int = Field(
        gt=0,
    )


class BrandProfileUpdate(BaseModel):

    brand_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    brand_description: str | None = Field(
        default=None,
        max_length=5000,
    )

    industry: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    tone: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    custom_voice: str | None = Field(
        default=None,
        max_length=5000,
    )

    primary_color: str | None = Field(
        default=None,
        max_length=32,
    )

    secondary_color: str | None = Field(
        default=None,
        max_length=32,
    )

    logo_asset_id: str | None = None

    website: str | None = Field(
        default=None,
        max_length=2048,
    )

    phone: str | None = Field(
        default=None,
        max_length=64,
    )

    whatsapp: str | None = Field(
        default=None,
        max_length=64,
    )

    email: str | None = Field(
        default=None,
        max_length=320,
    )

    address: str | None = Field(
        default=None,
        max_length=2048,
    )

    logo_position: OverlayPosition | None = None

    contact_position: OverlayPosition | None = None


class BrandProfileResponse(
    BrandProfileBase
):

    id: int
    tenant_id: str
    business_account_id: int

    model_config = {
        "from_attributes": True,
    }


class BrandProfile(BaseModel):

    name: str

    primary_color: str

    secondary_color: str

    fonts: dict[str, str] = Field(
        default_factory=dict
    )

    voice: dict[str, str] = Field(
        default_factory=dict
    )

    visual: dict = Field(
        default_factory=dict
    )

    hashtags: list[str] = Field(
        default_factory=list
    )

    products: list[dict] = Field(
        default_factory=list
    )

    logos: dict[str, str] = Field(
        default_factory=dict
    )

    templates: dict[str, str] = Field(
        default_factory=dict
    )

    website: str = ""

    contact_details: dict[str, str] = Field(
        default_factory=dict
    )

    logo_position: OverlayPosition = (
        DEFAULT_LOGO_POSITION
    )

    contact_position: OverlayPosition = (
        DEFAULT_CONTACT_POSITION
    )

    @field_validator(
        "logo_position",
        "contact_position",
        mode="before",
    )
    @classmethod
    def normalize_position(
        cls,
        value,
    ):
        if value is None:
            return value

        if isinstance(value, str):
            return LEGACY_POSITION_ALIASES.get(
                value,
                value,
            )

        return value