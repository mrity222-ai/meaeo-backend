from app.publishers.providers.mock import (
    MockPublisherProvider,
)


class MockLinkedInPublisherProvider(
    MockPublisherProvider
):

    @property
    def provider_name(self) -> str:

        return "linkedin"