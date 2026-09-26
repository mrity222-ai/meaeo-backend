from datetime import date, datetime, time

from app.parsers.rules.base import BaseNormalizer
from app.parsers.rules.registry import (
    NormalizerRegistry,
)


class DateTimeNormalizer(BaseNormalizer):

    @classmethod
    def supports(
        cls,
        annotation,
        value,
    ):

        return annotation in (
            datetime,
            date,
            time,
        )

    @classmethod
    def normalize(
        cls,
        value,
        annotation,
        context,
    ):

        if value is None:
            return None

        if isinstance(
            value,
            annotation,
        ):
            return value

        try:

            if annotation is datetime:

                return datetime.fromisoformat(
                    str(value)
                )

            if annotation is date:

                return date.fromisoformat(
                    str(value)
                )

            if annotation is time:

                return time.fromisoformat(
                    str(value)
                )

        except (TypeError, ValueError):

            return value

        return value


NormalizerRegistry.register(
    DateTimeNormalizer
)