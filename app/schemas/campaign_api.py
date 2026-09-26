from pydantic import BaseModel, Field


class CampaignRunRequest(BaseModel):

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