from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class CampaignScheduleRequest(BaseModel):

    schedule_type: Literal[
        "delay",
        "specific_time",
    ]

    delay_minutes: int | None = Field(
        default=None,
        ge=1,
        le=60 * 24 * 365,
    )

    scheduled_for: datetime | None = None


class CampaignScheduleResponse(BaseModel):

    campaign_id: int
    campaign_status: str
    scheduled_posts: int
    first_scheduled_for: datetime
    last_scheduled_for: datetime