from app.publishers.providers.mock import (
    MockPublisherProvider,
)


class MockGBPProvider(
    MockPublisherProvider
):

    @property
    def provider_name(self) -> str:

        return "google_business"