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
    data_source: str = "unverified"
    platform: str
    external_post_id: str

    published_at: datetime | None = None
    last_updated: datetime | None = None
    availability: str = "unavailable"
    unavailable_reason: str | None = None

    impressions: int | None = None
    reach: int | None = None

    likes: int | None = None
    comments: int | None = None
    shares: int | None = None
    saves: int | None = None

    clicks: int | None = None
    conversions: int | None = None

    engagement_rate: float | None = None

    metrics: list[AnalyticsMetric] = Field(
        default_factory=list
    )


class CampaignAnalytics(BaseModel):
    """
    Aggregated analytics for an entire campaign.
    """

    campaign_name: str
    data_source: str = "unverified"

    last_updated: datetime | None = None
    availability: str = "unavailable"
    campaign_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None

    posts: list[PostAnalytics] = Field(
        default_factory=list
    )

    total_impressions: int | None = None
    total_reach: int | None = None

    total_likes: int | None = None
    total_comments: int | None = None
    total_shares: int | None = None
    total_saves: int | None = None

    total_clicks: int | None = None
    total_conversions: int | None = None

    # Core rates
    engagement_rate: float | None = None
    click_through_rate: float | None = None
    conversion_rate: float | None = None

    # Campaign averages
    average_reach_per_post: float | None = None
    average_impressions_per_post: float | None = None
    average_engagements_per_post: float | None = None

    metrics: list[AnalyticsMetric] = Field(
        default_factory=list
    )