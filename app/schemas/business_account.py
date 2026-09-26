from datetime import datetime

from pydantic import BaseModel, Field


class BusinessAccountCreate(BaseModel):

    name: str = Field(
        min_length=1,
        max_length=255,
    )


class BusinessAccountResponse(BaseModel):

    id: int
    tenant_id: str
    name: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }