
from app.parsers.rules.base import BaseNormalizer


class PrimitiveNormalizer(BaseNormalizer):

    @classmethod
    def supports(
        cls,
        annotation,
        value,
    ):

        return annotation in (
            str,
            int,
            float,
            bool,
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

        try:
            if annotation is str:
                return str(value)
            if annotation is int:
                return int(value)
            if annotation is float:
                return float(value)
            if annotation is bool:
                if isinstance(value, bool):
                    return value
                if isinstance(value, str):
                    return value.lower() in (
                        "true",
                        "yes",
                        "1",
                        "y",
                    )
                return bool(value)

        except (TypeError, ValueError):
            return value
        return value
    
from app.parsers.rules.registry import NormalizerRegistry

NormalizerRegistry.register(
    PrimitiveNormalizer
)