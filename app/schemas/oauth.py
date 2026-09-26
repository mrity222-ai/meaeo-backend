from datetime import datetime

from pydantic import BaseModel, Field


class OAuthTransaction(BaseModel):
    transaction_id: str
    tenant_id: str
    business_account_id: int
    platform: str
    state: str
    redirect_uri: str
    created_at: datetime
    expires_at: datetime
    completed: bool = False
    selection_required: bool = False
    encrypted_access_token: str | None = None


class OAuthAccountSelectionRequest(BaseModel):
    transaction_id: str = Field(
        min_length=1
    )
    platform: str = Field(
        min_length=1
    )
    external_account_id: str = Field(
        min_length=1
    )