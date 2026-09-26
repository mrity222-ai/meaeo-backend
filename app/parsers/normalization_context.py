from typing import Any

from app.parsers.rules.registry import NormalizerRegistry


class NormalizationContext:

    def normalize(
        self,
        value: Any,
        annotation: Any,
    ) -> Any:

        for normalizer in NormalizerRegistry.get_normalizers():

            if normalizer.supports(
                annotation,
                value,
            ):

                return normalizer.normalize(
                    value,
                    annotation,
                    self,
                )

        return value