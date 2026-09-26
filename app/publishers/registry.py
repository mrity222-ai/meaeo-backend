from typing import ClassVar


class PublisherRegistry:

    _providers: ClassVar[dict] = {}

    @classmethod
    def register(
        cls,
        provider,
    ):

        name = (
            provider.provider_name
            .strip()
            .lower()
        )

        if not name:
            raise ValueError(
                "Publisher provider name cannot be empty."
            )

        cls._providers[name] = provider

    @classmethod
    def get(
        cls,
        name: str,
    ):

        normalized_name = (
            name.strip().lower()
        )

        if (
            normalized_name
            not in cls._providers
        ):
            raise ValueError(
                f"Unknown publisher: "
                f"{normalized_name}"
            )

        return cls._providers[
            normalized_name
        ]

    @classmethod
    def exists(
        cls,
        name: str,
    ) -> bool:

        return (
            name.strip().lower()
            in cls._providers
        )

    @classmethod
    def providers(cls):

        return dict(
            cls._providers
        )

    @classmethod
    def clear(cls):

        cls._providers.clear()