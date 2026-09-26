from typing import get_args, get_origin

from app.parsers.rules.base import BaseNormalizer


class CollectionNormalizer(BaseNormalizer):

    @classmethod
    def supports(
        cls,
        annotation,
        value,
    ):

        return get_origin(annotation) in (
            list,
            tuple,
            set,
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

        origin = get_origin(annotation)

        if isinstance(value, str):
            value = [
                item.strip()
                for item in value.split(",")
                if item.strip()
            ]

        if not isinstance(
            value,
            (
                list,
                tuple,
                set,
            ),
        ):

            value = [value]

        item_type = get_args(annotation)[0]
        result = [

            context.normalize(
                item,
                item_type,
            )

            for item in value

        ]

        if origin is tuple:
            return tuple(result)
        if origin is set:
            return set(result)

        return result

from app.parsers.rules.registry import NormalizerRegistry

NormalizerRegistry.register(
    CollectionNormalizer
)