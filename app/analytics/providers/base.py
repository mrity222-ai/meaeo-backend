from abc import ABC, abstractmethod

from app.analytics.result import AnalyticsResult
from app.schemas.publishing import PublishingResult


class BaseAnalyticsProvider(ABC):

    @property
    @abstractmethod
    def provider_name(self) -> str:
        ...

    @abstractmethod
    def collect(
        self,
        campaign_name: str,
        publishing: PublishingResult,
    ) -> AnalyticsResult:
        ...

    async def acollect(
        self,
        campaign_name: str,
        publishing: PublishingResult,
    ) -> AnalyticsResult:

        return self.collect(
            campaign_name,
            publishing,
        )