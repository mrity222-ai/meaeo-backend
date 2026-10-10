from pydantic import BaseModel, Field, field_validator


def validate_age_groups(value):
    if value is not None and any(group not in {"18-24", "25-34", "35-44", "45-54", "55+", "All Ages"} for group in value):
        raise ValueError("Select valid age groups.")
    return value


class TargetAudienceBase(BaseModel):
    _groups = field_validator("age_groups", check_fields=False)(validate_age_groups)


    name: str = Field(
        min_length=1,
        max_length=255,
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )

    age_groups: list[str] = Field(default_factory=list)

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
    _groups = field_validator("age_groups", check_fields=False)(validate_age_groups)


    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )

    age_groups: list[str] | None = None

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