from typing import ClassVar


class NormalizerRegistry:

    _normalizers: ClassVar[list] = []

    @classmethod
    def register(
        cls,
        normalizer,
    ):

        cls._normalizers.append(normalizer)

    @classmethod
    def get_normalizers(cls):

        return cls._normalizers