from app.publishers.factory import PublisherFactory
from app.schemas.publishing import PublishingResult
from app.schemas.schedule import PublishingSchedule


class PublishManager:

    @staticmethod
    def publish(
        schedule: PublishingSchedule,
    ) -> PublishingResult:

        provider = PublisherFactory.get_provider()
        return provider.publish(
            schedule
        )