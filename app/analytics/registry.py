from typing import ClassVar


class AnalyticsRegistry:

    _providers: ClassVar[dict] = {}

    @classmethod
    def register(
        cls,
        provider,
    ) -> None:

        cls._providers[
            provider.provider_name.lower()
        ] = provider

    @classmethod
    def get(
        cls,
        name: str,
    ):

        name = name.lower()
        if name not in cls._providers:
            raise ValueError(
                f"Unknown analytics provider: {name}"
            )
        return cls._providers[name]

    @classmethod
    def providers(cls):
        return cls._providers

    @classmethod
    def exists(
        cls,
        name: str,
    ) -> bool:
        return (
            name.lower()
            in cls._providers
        )