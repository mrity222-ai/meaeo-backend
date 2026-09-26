from datetime import date, datetime

from pydantic import BaseModel, Field


class AnalyticsMetric(BaseModel):
    """
    A single normalized analytics metric.
    """

    name: str
    value: float = 0.0
    metric_type: str = "count"


class PostAnalytics(BaseModel):
    """
    Normalized performance data for one published post.
    """

    campaign_name: str
    platform: str
    external_post_id: str

    published_at: datetime | None = None

    impressions: int = 0
    reach: int = 0

    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0

    clicks: int = 0
    conversions: int = 0

    engagement_rate: float = 0.0

    metrics: list[AnalyticsMetric] = Field(
        default_factory=list
    )


class CampaignAnalytics(BaseModel):
    """
    Aggregated analytics for an entire campaign.
    """

    campaign_name: str

    start_date: date | None = None
    end_date: date | None = None

    posts: list[PostAnalytics] = Field(
        default_factory=list
    )

    total_impressions: int = 0
    total_reach: int = 0

    total_likes: int = 0
    total_comments: int = 0
    total_shares: int = 0
    total_saves: int = 0

    total_clicks: int = 0
    total_conversions: int = 0

    # Core rates
    engagement_rate: float = 0.0
    click_through_rate: float = 0.0
    conversion_rate: float = 0.0

    # Campaign averages
    average_reach_per_post: float = 0.0
    average_impressions_per_post: float = 0.0
    average_engagements_per_post: float = 0.0

    metrics: list[AnalyticsMetric] = Field(
        default_factory=list
    )