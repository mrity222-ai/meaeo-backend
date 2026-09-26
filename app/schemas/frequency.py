from datetime import datetime
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, Field, field_validator, model_validator


FrequencyType = Literal[
    "daily",
    "interval",
    "weekly",
    "monthly",
]


DayOfWeek = Literal[
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]


class FrequencyConfig(BaseModel):
    frequency_type: FrequencyType = "daily"

    interval_days: int | None = Field(
        default=None,
        ge=1,
        le=365,
    )

    days_of_week: list[DayOfWeek] = Field(
        default_factory=list,
    )

    posts_per_week: int | None = Field(
        default=None,
        ge=1,
        le=7,
    )

    posts_per_month: int | None = Field(
        default=None,
        ge=1,
        le=31,
    )

    posting_time: str = "10:00"

    timezone: str = "UTC"

    @field_validator("posting_time")
    @classmethod
    def validate_posting_time(cls, value: str) -> str:
        parts = value.split(":")

        if len(parts) != 2:
            raise ValueError(
                "posting_time must use HH:MM format"
            )

        try:
            hour = int(parts[0])
            minute = int(parts[1])
        except ValueError as exc:
            raise ValueError(
                "posting_time must use HH:MM format"
            ) from exc

        if not 0 <= hour <= 23:
            raise ValueError(
                "posting_time hour must be between 00 and 23"
            )

        if not 0 <= minute <= 59:
            raise ValueError(
                "posting_time minute must be between 00 and 59"
            )

        return f"{hour:02d}:{minute:02d}"

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "timezone cannot be empty"
            )

        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError(
                f"invalid timezone: {value}"
            ) from exc

        return value

    @field_validator("days_of_week")
    @classmethod
    def validate_days_of_week(
        cls,
        value: list[DayOfWeek],
    ) -> list[DayOfWeek]:

        if len(value) != len(set(value)):
            raise ValueError(
                "days_of_week cannot contain duplicates"
            )

        return value

    @model_validator(mode="after")
    def validate_configuration(self):
        if self.frequency_type == "daily":
            if self.interval_days is not None:
                raise ValueError(
                    "interval_days is only valid for interval frequency"
                )

            if self.posts_per_week is not None:
                raise ValueError(
                    "posts_per_week is only valid for weekly frequency"
                )

            if self.posts_per_month is not None:
                raise ValueError(
                    "posts_per_month is only valid for monthly frequency"
                )

            if self.days_of_week:
                raise ValueError(
                    "days_of_week is only valid for weekly frequency"
                )

        elif self.frequency_type == "interval":
            if self.interval_days is None:
                raise ValueError(
                    "interval_days is required for interval frequency"
                )

            if self.days_of_week:
                raise ValueError(
                    "days_of_week is only valid for weekly frequency"
                )

            if self.posts_per_week is not None:
                raise ValueError(
                    "posts_per_week is only valid for weekly frequency"
                )

            if self.posts_per_month is not None:
                raise ValueError(
                    "posts_per_month is only valid for monthly frequency"
                )

        elif self.frequency_type == "weekly":
            if self.posts_per_week is None:
                raise ValueError(
                    "posts_per_week is required for weekly frequency"
                )

            if not self.days_of_week:
                raise ValueError(
                    "days_of_week is required for weekly frequency"
                )

            if len(self.days_of_week) != self.posts_per_week:
                raise ValueError(
                    "days_of_week count must match posts_per_week"
                )

            if self.interval_days is not None:
                raise ValueError(
                    "interval_days is only valid for interval frequency"
                )

            if self.posts_per_month is not None:
                raise ValueError(
                    "posts_per_month is only valid for monthly frequency"
                )

        elif self.frequency_type == "monthly":
            if self.posts_per_month is None:
                raise ValueError(
                    "posts_per_month is required for monthly frequency"
                )

            if self.interval_days is not None:
                raise ValueError(
                    "interval_days is only valid for interval frequency"
                )

            if self.days_of_week:
                raise ValueError(
                    "days_of_week is only valid for weekly frequency"
                )

            if self.posts_per_week is not None:
                raise ValueError(
                    "posts_per_week is only valid for weekly frequency"
                )

        return self