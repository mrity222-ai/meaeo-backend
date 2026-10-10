import re
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from pydantic import model_validator
from pydantic import BaseModel, Field, HttpUrl
from app.schemas.business import BusinessProfileBase, BusinessProfileResponse
from app.schemas.brand import BrandProfileBase, BrandProfileResponse
from app.schemas.audience import TargetAudienceBase, TargetAudienceResponse
from app.schemas.marketing_preferences import MarketingPreferencesBase, MarketingPreferencesResponse
from app.schemas.phone import normalize_phone
from pydantic import field_validator


class EditableBrand(BrandProfileBase):
    phone: str = Field(min_length=1, max_length=64)
    @field_validator("website")
    @classmethod
    def normalize_website(cls, value):
        return str(HttpUrl(value)) if value else None

    _phone_validation = field_validator("phone")(normalize_phone)
    @field_validator("brand_name", "industry", "tone")
    @classmethod
    def required_text(cls, value):
        if not value.strip():
            raise ValueError("This field is required.")
        return value.strip()



class EditableBusiness(BusinessProfileBase):
    @field_validator("business_name", "category", "description", "country")
    @classmethod
    def required_text(cls, value):
        if not value.strip():
            raise ValueError("This field is required.")
        return value.strip()


class EditablePreferences(MarketingPreferencesBase):
    @field_validator("timezone")
    @classmethod
    def valid_timezone(cls, value):
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValueError("Enter a valid timezone, e.g. Asia/Kolkata.")
        return value

    @field_validator("preferred_posting_time")
    @classmethod
    def valid_time(cls, value):
        if not re.fullmatch(r"(?:[01][0-9]|2[0-3]):[0-5][0-9]", value):
            raise ValueError("Posting time must use HH:MM in 24-hour format.")
        return value

    @model_validator(mode="after")
    def custom_schedule(self):
        if self.posting_frequency == "custom" and not self.posting_frequency_config:
            raise ValueError("A custom frequency needs its existing schedule configuration.")
        return self


class BusinessSettingsUpdate(BaseModel):
    business: EditableBusiness
    brand: EditableBrand
    audience_id: int | None = Field(default=None, gt=0)
    audience: TargetAudienceBase | None = None
    preferences: EditablePreferences | None = None


class BusinessSettingsResponse(BaseModel):
    business: BusinessProfileResponse | None
    brand: BrandProfileResponse | None
    audiences: list[TargetAudienceResponse]
    preferences: MarketingPreferencesResponse | None
    logo_url: str | None = None
