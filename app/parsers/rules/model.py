from pydantic import BaseModel

from app.parsers.rules.base import BaseNormalizer


class ModelNormalizer(BaseNormalizer):

    @classmethod
    def supports(
        cls,
        annotation,
        value,
    ):

        try:

            return issubclass(
                annotation,
                BaseModel,
            )

        except TypeError:

            return False

    @classmethod
    def normalize(
        cls,
        value,
        annotation,
        context,
    ):

        if value is None:
            return None

        if not isinstance(
            value,
            dict,
        ):

            return value

        normalized = {}

        for name, field in annotation.model_fields.items():

            if name not in value:
                continue

            normalized[name] = context.normalize(
                value[name],
                field.annotation,
            )

        return normalized

from app.parsers.rules.registry import NormalizerRegistry

NormalizerRegistry.register(
    ModelNormalizer
)