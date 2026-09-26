from app.analytics.providers.base import (
    BaseAnalyticsProvider,
)
from app.analytics.result import AnalyticsResult
from app.analytics.schemas import (
    PostAnalytics,
)
from app.schemas.publishing import (
    PublishingResult,
)


class MockAnalyticsProvider(
    BaseAnalyticsProvider
):

    @property
    def provider_name(self) -> str:
        return "mock"

    def collect(
        self,
        campaign_name: str,
        publishing: PublishingResult,
    ) -> AnalyticsResult:

        posts = []

        for published_post in publishing.posts:

            if published_post.status not in (
                "published",
                "scheduled",
            ):
                continue

            posts.append(
                PostAnalytics(
                    campaign_name=campaign_name,
                    platform=published_post.platform,
                    external_post_id=(
                        published_post.external_id
                    ),
                    published_at=(
                        published_post.published_at
                    ),
                    impressions=1000,
                    reach=800,
                    likes=50,
                    comments=5,
                    shares=3,
                    saves=2,
                    clicks=25,
                    conversions=2,
                    engagement_rate=0.075,
                )
            )

        return AnalyticsResult(
            posts=posts,
            provider=self.provider_name,
            success=True,
        )

    async def acollect(
        self,
        campaign_name: str,
        publishing: PublishingResult,
    ) -> AnalyticsResult:

        return self.collect(
            campaign_name,
            publishing,
        )