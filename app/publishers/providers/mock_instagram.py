from app.publishers.providers.mock import (
    MockPublisherProvider,
)


class MockInstagramPublisherProvider(
    MockPublisherProvider
):

    @property
    def provider_name(self) -> str:

        return "instagram"