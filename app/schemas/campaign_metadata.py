from datetime import datetime, timezone

from pydantic import BaseModel, Field


class CampaignMetadata(BaseModel):

    version: str = "1.0"

    status: str = "draft"

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(
            timezone.utc
        )
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(
            timezone.utc
        )
    )