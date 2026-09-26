from typing import ClassVar

from app.models.image.providers.huggingface import HuggingFaceImageProvider
from app.models.image.providers.mock import MockImageProvider


class ImageRegistry:

    PROVIDERS: ClassVar[dict] = {
        "huggingface": HuggingFaceImageProvider,
        "mock": MockImageProvider,
    }

    MODELS: ClassVar[dict] = {
        "huggingface": {
            "default": "black-forest-labs/FLUX.1-schnell",
        },
        "mock": {
            "default": None,
        },
    }


    @classmethod
    def get_provider(cls, provider: str):

        try:
            return cls.PROVIDERS[provider.lower()]

        except KeyError:
            raise ValueError(
                f"Image provider '{provider}' is not supported."
            )

    @classmethod
    def get_model(cls, provider: str, alias: str):

        try:
            return cls.MODELS[
                provider.lower()
            ][
                alias
            ]

        except KeyError:
            raise ValueError(
                f"Image model alias '{alias}' not found."
            )