from datetime import time

from pydantic import BaseModel, field_validator


class AgeRangeValidation(BaseModel):

    age_min: int | None = None
    age_max: int | None = None

    @field_validator("age_max")
    @classmethod
    def validate_age_range(
        cls,
        value,
        info,
    ):
        age_min = info.data.get(
            "age_min"
        )

        if (
            value is not None
            and age_min is not None
            and value < age_min
        ):
            raise ValueError(
                "age_max must be greater than or "
                "equal to age_min."
            )

        return value


class PostingTimeValidation(BaseModel):

    preferred_posting_time: str

    @field_validator(
        "preferred_posting_time"
    )
    @classmethod
    def validate_posting_time(cls, value):

        try:
            time.fromisoformat(value)
        except ValueError as exc:
            raise ValueError(
                "preferred_posting_time must be "
                "a valid HH:MM or HH:MM:SS time."
            ) from exc

        return value