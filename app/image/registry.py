from typing import ClassVar


class ImageProviderRegistry:

    _providers: ClassVar[dict] = {}

    @classmethod
    def register(
        cls,
        provider,
    ):

        cls._providers[
            provider.provider_name.lower()
        ] = provider

    @classmethod
    def get(
        cls,
        name,
    ):

        name = name.lower()

        if name not in cls._providers:

            raise ValueError(
                f"Unknown image provider: {name}"
            )

        return cls._providers[name]

    @classmethod
    def providers(cls):
        return cls._providers