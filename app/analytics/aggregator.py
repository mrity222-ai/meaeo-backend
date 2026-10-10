from app.analytics.metrics import AnalyticsMetrics, complete_total
from app.analytics.schemas import CampaignAnalytics, PostAnalytics


class AnalyticsAggregator:
    @staticmethod
    def aggregate(campaign_name: str, posts: list[PostAnalytics]) -> CampaignAnalytics:
        fields = ("impressions", "reach", "likes", "comments", "shares", "saves", "clicks", "conversions")
        totals = {"total_" + field: complete_total(posts, field) for field in fields}
        updated = [post.last_updated for post in posts if post.last_updated is not None]
        available = sum(value is not None for value in totals.values())
        return CampaignAnalytics(campaign_name=campaign_name, posts=posts, **totals,
            data_source="platform_api" if any(post.data_source == "platform_api" for post in posts) else "unavailable",
            last_updated=max(updated) if updated else None,
            availability="available" if available == len(fields) else "partial" if available or updated else "unavailable",
            engagement_rate=AnalyticsMetrics.engagement_rate(posts),
            click_through_rate=AnalyticsMetrics.click_through_rate(posts),
            conversion_rate=AnalyticsMetrics.conversion_rate(posts),
            average_reach_per_post=AnalyticsMetrics.average_reach_per_post(posts),
            average_impressions_per_post=AnalyticsMetrics.average_impressions_per_post(posts),
            average_engagements_per_post=AnalyticsMetrics.average_engagements_per_post(posts))
