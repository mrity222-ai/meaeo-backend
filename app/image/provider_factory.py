from app.image.providers.cloudflare import CloudflareImageProvider
from app.image.providers.fal import FalImageProvider
from app.image.providers.gemini import GeminiImageProvider
from app.image.providers.huggingface import HuggingFaceImageProvider
from app.image.providers.mock import MockImageProvider
from app.image.providers.openai import OpenAIImageProvider
from app.image.providers.stability import StabilityImageProvider
from app.image.registry import ImageProviderRegistry
from app.models.config import settings


class ImageProviderFactory:

    _initialized = False
    _initialized_mode: str | None = None

    @classmethod
    def reset(cls) -> None:
        """Force re-initialization on next get() after settings change."""
        cls._initialized = False
        cls._initialized_mode = None
        ImageProviderRegistry.providers().clear()

    @classmethod
    def _initialize(cls) -> None:
        mode = (
            getattr(settings, "IMAGE_MODEL_PROVIDER", "huggingface")
            .strip()
            .lower()
        )

        providers = ImageProviderRegistry.providers()

        if (
            cls._initialized
            and cls._initialized_mode == mode
            and mode in providers
        ):
            return

        providers.clear()

        if mode == "huggingface":
            ImageProviderRegistry.register(
                HuggingFaceImageProvider()
            )
        elif mode == "openai":
            ImageProviderRegistry.register(
                OpenAIImageProvider()
            )
        elif mode == "gemini":
            ImageProviderRegistry.register(
                GeminiImageProvider()
            )
        elif mode == "stability":
            ImageProviderRegistry.register(
                StabilityImageProvider()
            )
        elif mode == "cloudflare":
            ImageProviderRegistry.register(
                CloudflareImageProvider()
            )
        elif mode == "fal":
            ImageProviderRegistry.register(
                FalImageProvider()
            )
        elif mode == "mock":
            ImageProviderRegistry.register(
                MockImageProvider()
            )
        else:
            # Fallback to huggingface if unknown
            ImageProviderRegistry.register(
                HuggingFaceImageProvider()
            )

        cls._initialized = True
        cls._initialized_mode = mode

    @classmethod
    def get(cls):
        cls._initialize()

        provider_name = (
            getattr(settings, "IMAGE_MODEL_PROVIDER", "huggingface")
            .strip()
            .lower()
        )

        try:
            return ImageProviderRegistry.get(provider_name)
        except Exception:
            return HuggingFaceImageProvider()