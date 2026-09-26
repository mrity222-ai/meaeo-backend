from typing import Literal

from pydantic import (
    BaseModel,
    Field,
    field_validator,
)

from app.schemas.frequency import FrequencyConfig


ApprovalMode = Literal[
    "autonomous",
    "human_intervention",
]


PostingFrequency = Literal[
    "daily",
    "weekdays",
    "three_times_per_week",
    "custom",
]


class MarketingPreferencesBase(BaseModel):

    primary_goal: str = Field(
        min_length=1,
        max_length=255,
    )

    secondary_goals: list[str] = Field(
        default_factory=list,
    )

    content_types: list[str] = Field(
        default_factory=list,
    )

    creativity_level: str | None = Field(
        default=None,
        max_length=64,
    )

    promotional_intensity: str | None = Field(
        default=None,
        max_length=64,
    )

    approval_mode: ApprovalMode = (
        "autonomous"
    )

    timezone: str = Field(
        default="UTC",
        min_length=1,
        max_length=64,
    )

    preferred_posting_time: str = Field(
        default="10:00",
        min_length=4,
        max_length=16,
    )

    posting_frequency: PostingFrequency = (
        "daily"
    )

    posting_frequency_config: FrequencyConfig | None = None

    @field_validator("posting_frequency_config")
    @classmethod
    def validate_frequency_config(
        cls,
        value: FrequencyConfig | None,
    ) -> FrequencyConfig | None:

        if value is not None:
            value.validate_configuration()

        return value


class MarketingPreferencesCreate(
    MarketingPreferencesBase
):
    business_account_id: int = Field(
        gt=0,
    )


class MarketingPreferencesUpdate(BaseModel):

    primary_goal: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    secondary_goals: list[str] | None = None

    content_types: list[str] | None = None

    creativity_level: str | None = Field(
        default=None,
        max_length=64,
    )

    promotional_intensity: str | None = Field(
        default=None,
        max_length=64,
    )

    approval_mode: ApprovalMode = "autonomous"

    timezone: str | None = Field(
        default=None,
        min_length=1,
        max_length=64,
    )

    preferred_posting_time: str | None = Field(
        default=None,
        min_length=4,
        max_length=16,
    )

    posting_frequency: PostingFrequency | None = None

    posting_frequency_config: FrequencyConfig | None = None

    @field_validator("posting_frequency_config")
    @classmethod
    def validate_frequency_config(
        cls,
        value: FrequencyConfig | None,
    ) -> FrequencyConfig | None:

        if value is not None:
            value.validate_configuration()

        return value


class MarketingPreferencesResponse(
    MarketingPreferencesBase
):

    id: int
    tenant_id: str
    business_account_id: int

    model_config = {
        "from_attributes": True,
    }