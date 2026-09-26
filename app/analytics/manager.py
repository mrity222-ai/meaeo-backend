from datetime import date

from app.analytics.aggregator import (
    AnalyticsAggregator,
)
from app.analytics.providers.mock import (
    MockAnalyticsProvider,
)
from app.analytics.registry import (
    AnalyticsRegistry,
)
from app.analytics.result import (
    AnalyticsResult,
)
from app.repositories.analytics_repository import (
    AnalyticsRepository,
)
from app.schemas.publishing import (
    PublishingResult,
)


class AnalyticsManager:

    _initialized = False
    _repository: AnalyticsRepository | None = None

    @classmethod
    def _initialize(cls):

        if cls._initialized:
            return

        provider = MockAnalyticsProvider()

        AnalyticsRegistry.register(
            provider
        )

        cls._repository = (
            AnalyticsRepository()
        )

        cls._initialized = True

    @classmethod
    def get_provider(cls):

        cls._initialize()

        return AnalyticsRegistry.get(
            "mock"
        )

    @classmethod
    def get_repository(
        cls,
    ) -> AnalyticsRepository:

        cls._initialize()

        if cls._repository is None:
            cls._repository = (
                AnalyticsRepository()
            )

        return cls._repository

    @classmethod
    def collect(
        cls,
        tenant_id: str,
        campaign_name: str,
        publishing: PublishingResult,
        snapshot_date: date | None = None,
    ) -> AnalyticsResult:

        if not tenant_id:
            raise ValueError(
                "tenant_id is required for analytics collection."
            )

        if not campaign_name:
            raise ValueError(
                "campaign_name is required for analytics collection."
            )

        provider = cls.get_provider()

        result = provider.collect(
            campaign_name,
            publishing,
        )

        if not result.success:
            return result

        analytics = (
            AnalyticsAggregator.aggregate(
                campaign_name,
                result.posts,
            )
        )

        result.analytics = analytics

        try:

            cls.get_repository().save(
                tenant_id=tenant_id,
                analytics=analytics,
                snapshot_date=snapshot_date,
            )

        except Exception as exc:

            result.success = False

            result.errors.append(
                "Analytics persistence failed: "
                f"{exc}"
            )

        return result

    @classmethod
    async def acollect(
        cls,
        tenant_id: str,
        campaign_name: str,
        publishing: PublishingResult,
        snapshot_date: date | None = None,
    ) -> AnalyticsResult:

        if not tenant_id:
            raise ValueError(
                "tenant_id is required for analytics collection."
            )

        if not campaign_name:
            raise ValueError(
                "campaign_name is required for analytics collection."
            )

        provider = cls.get_provider()

        result = await provider.acollect(
            campaign_name,
            publishing,
        )

        if not result.success:
            return result

        analytics = (
            AnalyticsAggregator.aggregate(
                campaign_name,
                result.posts,
            )
        )

        result.analytics = analytics

        try:

            cls.get_repository().save(
                tenant_id=tenant_id,
                analytics=analytics,
                snapshot_date=snapshot_date,
            )

        except Exception as exc:

            result.success = False

            result.errors.append(
                "Analytics persistence failed: "
                f"{exc}"
            )

        return result