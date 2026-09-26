from dataclasses import dataclass, field

from app.analytics.schemas import (
    CampaignAnalytics,
    PostAnalytics,
)


@dataclass(slots=True)
class AnalyticsResult:

    analytics: CampaignAnalytics | None = None

    posts: list[PostAnalytics] = field(
        default_factory=list
    )
    provider: str = ""
    errors: list[str] = field(
        default_factory=list
    )
    warnings: list[str] = field(
        default_factory=list
    )
    success: bool = True