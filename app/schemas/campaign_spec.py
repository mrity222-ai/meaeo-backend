from pydantic import BaseModel, Field

from app.schemas.image import ImageStrategy


class CampaignSpec(BaseModel):

    campaign_name: str

    campaign_goal: str

    target_audience: str

    target_platforms: list[str]

    duration_days: int = Field(
        default=7,
        ge=1,
        description=(
            "Number of days the campaign should run. "
            "Content generation must produce exactly one post "
            "for each campaign day."
        ),
    )

    business_constraints: list[str] = Field(
        default_factory=list
    )

    success_metrics: list[str] = Field(
        default_factory=list
    )

    posting_frequency: int = Field(
        default=1,
        ge=1,
        description=(
            "Number of posts scheduled per day."
        ),
    )

    preferred_posting_time: str = "10:00"

    timezone: str = "Asia/Kolkata"

    image_strategy: ImageStrategy = Field(
        default_factory=ImageStrategy
    )