from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ExecutionMode = Literal[
    "autonomous",
    "human_intervention",
]


class CampaignCreateRequest(BaseModel):

    business_account_id: int = Field(
        gt=0,
    )

    campaign_name: str

    execution_mode: ExecutionMode | None = None


class CampaignStatusUpdateRequest(BaseModel):

    status: str


class CampaignResponse(BaseModel):

    id: int

    tenant_id: str

    business_account_id: int

    campaign_name: str

    execution_mode: ExecutionMode

    status: str

    created_at: datetime

    updated_at: datetime

    started_at: datetime | None = None

    paused_at: datetime | None = None

    completed_at: datetime | None = None

    cancelled_at: datetime | None = None

    model_config = {
        "from_attributes": True,
    }