from pydantic import BaseModel, Field


class TargetAudienceBase(BaseModel):

    name: str = Field(
        min_length=1,
        max_length=255,
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )

    age_min: int | None = Field(
        default=None,
        ge=13,
        le=120,
    )

    age_max: int | None = Field(
        default=None,
        ge=13,
        le=120,
    )

    genders: list[str] = Field(
        default_factory=list,
    )

    locations: list[str] = Field(
        default_factory=list,
    )

    languages: list[str] = Field(
        default_factory=list,
    )

    interests: list[str] = Field(
        default_factory=list,
    )

    pain_points: list[str] = Field(
        default_factory=list,
    )

    needs: list[str] = Field(
        default_factory=list,
    )


class TargetAudienceCreate(
    TargetAudienceBase
):
    business_account_id: int = Field(
        gt=0,
    )


class TargetAudienceUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )

    age_min: int | None = Field(
        default=None,
        ge=13,
        le=120,
    )

    age_max: int | None = Field(
        default=None,
        ge=13,
        le=120,
    )

    genders: list[str] | None = None
    locations: list[str] | None = None
    languages: list[str] | None = None
    interests: list[str] | None = None
    pain_points: list[str] | None = None
    needs: list[str] | None = None


class TargetAudienceResponse(
    TargetAudienceBase
):

    id: int
    tenant_id: str
    business_account_id: int

    model_config = {
        "from_attributes": True,
    }