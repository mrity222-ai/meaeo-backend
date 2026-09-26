from app.models.config import settings

from app.publishers.providers.facebook import (
    FacebookPublisherProvider,
)
from app.publishers.providers.google_business import (
    GoogleBusinessPublisherProvider,
)
from app.publishers.providers.instagram import (
    InstagramPublisherProvider,
)
from app.publishers.providers.linkedin import (
    LinkedInPublisherProvider,
)
from app.publishers.providers.mock import (
    MockPublisherProvider,
)
from app.publishers.providers.mock_gbp import (
    MockGBPProvider,
)
from app.publishers.providers.mock_instagram import (
    MockInstagramPublisherProvider,
)
from app.publishers.providers.mock_linkedin import (
    MockLinkedInPublisherProvider,
)
from app.publishers.registry import (
    PublisherRegistry,
)


class PublisherFactory:

    _initialized = False
    _initialized_mode: str | None = None

    @classmethod
    def _initialize(cls) -> None:

        mode = (
            settings.PUBLISH_MODE
            .strip()
            .lower()
        )

        providers = (
            PublisherRegistry.providers()
        )

        if (
            cls._initialized
            and cls._initialized_mode == mode
            and providers
        ):
            return

        PublisherRegistry.clear()

        if mode == "production":

            PublisherRegistry.register(
                InstagramPublisherProvider()
            )

            PublisherRegistry.register(
                FacebookPublisherProvider()
            )

            PublisherRegistry.register(
                LinkedInPublisherProvider()
            )

            PublisherRegistry.register(
                GoogleBusinessPublisherProvider()
            )

        else:

            PublisherRegistry.register(
                MockPublisherProvider()
            )

            PublisherRegistry.register(
                MockInstagramPublisherProvider()
            )

            PublisherRegistry.register(
                MockLinkedInPublisherProvider()
            )

            PublisherRegistry.register(
                MockGBPProvider()
            )

        cls._initialized = True
        cls._initialized_mode = mode

    @classmethod
    def get_provider(
        cls,
        platform: str | None = None,
    ):

        cls._initialize()

        if platform is None:
            platform = (
                settings.PUBLISH_PROVIDER
            )

        return PublisherRegistry.get(
            platform
        )