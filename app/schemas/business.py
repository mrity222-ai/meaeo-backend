from pydantic import BaseModel, Field, HttpUrl


class BusinessProfileBase(BaseModel):

    business_name: str = Field(
        min_length=1,
        max_length=255,
    )

    category: str = Field(
        min_length=1,
        max_length=255,
    )

    description: str = Field(
        min_length=1,
        max_length=5000,
    )

    website: HttpUrl | None = None

    country: str = Field(
        min_length=1,
        max_length=128,
    )

    city: str | None = Field(
        default=None,
        max_length=255,
    )


class BusinessProfileCreate(
    BusinessProfileBase
):
    business_account_id: int = Field(
        gt=0,
    )


class BusinessProfileUpdate(BaseModel):

    business_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    category: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    description: str | None = Field(
        default=None,
        min_length=1,
        max_length=5000,
    )

    website: HttpUrl | None = None

    country: str | None = Field(
        default=None,
        min_length=1,
        max_length=128,
    )

    city: str | None = Field(
        default=None,
        max_length=255,
    )


class BusinessProfileResponse(
    BusinessProfileBase
):

    id: int
    tenant_id: str
    business_account_id: int

    model_config = {
        "from_attributes": True,
    }