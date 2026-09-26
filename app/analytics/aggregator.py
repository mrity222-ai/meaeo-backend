from app.analytics.metrics import (
    AnalyticsMetrics,
)
from app.analytics.schemas import (
    CampaignAnalytics,
    PostAnalytics,
)


class AnalyticsAggregator:
    """
    Aggregates normalized post-level analytics into
    campaign-level analytics.

    This component is provider-independent.
    """

    @staticmethod
    def aggregate(
        campaign_name: str,
        posts: list[PostAnalytics],
    ) -> CampaignAnalytics:

        total_impressions = sum(
            post.impressions
            for post in posts
        )
        total_reach = sum(
            post.reach
            for post in posts
        )
        total_likes = sum(
            post.likes
            for post in posts
        )
        total_comments = sum(
            post.comments
            for post in posts
        )
        total_shares = sum(
            post.shares
            for post in posts
        )
        total_saves = sum(
            post.saves
            for post in posts
        )
        total_clicks = sum(
            post.clicks
            for post in posts
        )
        total_conversions = sum(
            post.conversions
            for post in posts
        )

        engagement_rate = (
            AnalyticsMetrics.engagement_rate(
                posts
            )
        )
        click_through_rate = (
            AnalyticsMetrics.click_through_rate(
                posts
            )
        )
        conversion_rate = (
            AnalyticsMetrics.conversion_rate(
                posts
            )
        )
        average_reach_per_post = (
            AnalyticsMetrics.average_reach_per_post(
                posts
            )
        )
        average_impressions_per_post = (
            AnalyticsMetrics.average_impressions_per_post(
                posts
            )
        )
        average_engagements_per_post = (
            AnalyticsMetrics.average_engagements_per_post(
                posts
            )
        )

        return CampaignAnalytics(
            campaign_name=campaign_name,
            posts=posts,

            total_impressions=total_impressions,
            total_reach=total_reach,
            total_likes=total_likes,
            total_comments=total_comments,
            total_shares=total_shares,
            total_saves=total_saves,
            total_clicks=total_clicks,
            total_conversions=total_conversions,

            engagement_rate=engagement_rate,
            click_through_rate=click_through_rate,
            conversion_rate=conversion_rate,

            average_reach_per_post=(
                average_reach_per_post
            ),

            average_impressions_per_post=(
                average_impressions_per_post
            ),

            average_engagements_per_post=(
                average_engagements_per_post
            ),
        )