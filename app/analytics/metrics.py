from app.analytics.schemas import (
    PostAnalytics,
)


class AnalyticsMetrics:

    @staticmethod
    def engagement_rate(
        posts: list[PostAnalytics],
    ) -> float:

        total_reach = sum(
            post.reach
            for post in posts
        )

        total_engagements = sum(
            post.likes
            + post.comments
            + post.shares
            + post.saves
            for post in posts
        )

        if total_reach <= 0:
            return 0.0

        return (
            total_engagements
            / total_reach
        )

    @staticmethod
    def click_through_rate(
        posts: list[PostAnalytics],
    ) -> float:

        total_impressions = sum(
            post.impressions
            for post in posts
        )

        total_clicks = sum(
            post.clicks
            for post in posts
        )

        if total_impressions <= 0:
            return 0.0

        return (
            total_clicks
            / total_impressions
        )

    @staticmethod
    def conversion_rate(
        posts: list[PostAnalytics],
    ) -> float:

        total_clicks = sum(
            post.clicks
            for post in posts
        )

        total_conversions = sum(
            post.conversions
            for post in posts
        )

        if total_clicks <= 0:
            return 0.0

        return (
            total_conversions
            / total_clicks
        )

    @staticmethod
    def average_reach_per_post(
        posts: list[PostAnalytics],
    ) -> float:

        if not posts:
            return 0.0

        total_reach = sum(
            post.reach
            for post in posts
        )

        return total_reach / len(posts)

    @staticmethod
    def average_impressions_per_post(
        posts: list[PostAnalytics],
    ) -> float:

        if not posts:
            return 0.0

        total_impressions = sum(
            post.impressions
            for post in posts
        )

        return (
            total_impressions
            / len(posts)
        )

    @staticmethod
    def average_engagements_per_post(
        posts: list[PostAnalytics],
    ) -> float:

        if not posts:
            return 0.0

        total_engagements = sum(
            post.likes
            + post.comments
            + post.shares
            + post.saves
            for post in posts
        )

        return (
            total_engagements
            / len(posts)
        )