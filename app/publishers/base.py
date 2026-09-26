from abc import ABC, abstractmethod

from app.schemas.publishing import PublishingResult
from app.schemas.schedule import PublishingSchedule


class BasePublisherProvider(ABC):

    @property
    @abstractmethod
    def provider_name(self) -> str:
        ...

    @abstractmethod
    def publish(
        self,
        schedule: PublishingSchedule,
    ) -> PublishingResult:
        ...

    async def apublish(
        self,
        schedule: PublishingSchedule,
    ) -> PublishingResult:

        return self.publish(schedule)