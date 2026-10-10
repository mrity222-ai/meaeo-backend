from app.analytics.schemas import PostAnalytics


def complete_total(posts, *fields):
    values = [getattr(post, field) for post in posts for field in fields]
    return sum(values) if values and all(value is not None for value in values) else None


def ratio(numerator, denominator):
    if numerator is None or denominator is None or denominator <= 0:
        return None
    return numerator / denominator


class AnalyticsMetrics:
    @staticmethod
    def engagement_rate(posts):
        return ratio(complete_total(posts, "likes", "comments", "shares", "saves"), complete_total(posts, "reach"))

    @staticmethod
    def click_through_rate(posts):
        return ratio(complete_total(posts, "clicks"), complete_total(posts, "impressions"))

    @staticmethod
    def conversion_rate(posts):
        return ratio(complete_total(posts, "conversions"), complete_total(posts, "clicks"))

    @staticmethod
    def average_reach_per_post(posts):
        return ratio(complete_total(posts, "reach"), len(posts))

    @staticmethod
    def average_impressions_per_post(posts):
        return ratio(complete_total(posts, "impressions"), len(posts))

    @staticmethod
    def average_engagements_per_post(posts):
        return ratio(complete_total(posts, "likes", "comments", "shares", "saves"), len(posts))
