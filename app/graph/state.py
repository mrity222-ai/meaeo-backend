from typing import Literal, TypedDict

from app.analytics.schemas import CampaignAnalytics
from app.campaign.campaign_context import CampaignContext
from app.research.context import ResearchContext
from app.schemas.brand import BrandProfile
from app.schemas.campaign_spec import CampaignSpec
from app.schemas.content import ContentPlan
from app.schemas.image import (
    ImagePlan,
    ImageStrategy,
)
from app.schemas.publishing import PublishingResult
from app.schemas.research import ResearchReport
from app.schemas.schedule import PublishingSchedule
from app.schemas.strategy import MarketingStrategy


ExecutionMode = Literal[
    "autonomous",
    "human_intervention",
]


class AgentState(TypedDict, total=False):
    tenant_id: str
    business_account_id: int
    execution_mode: ExecutionMode

    user_input: str
    brand_name: str | None

    # Active, enabled social channels available for this execution.
    available_platforms: list[str]

    campaign_context: CampaignContext | None

    brand_profile: BrandProfile | None
    campaign: CampaignSpec | None

    raw_research: ResearchContext | None
    research: ResearchReport | None

    strategy: MarketingStrategy | None
    content: ContentPlan | None

    original_images: dict[int, str]
    catalogue_selection: dict[int, str]

    image_plan: ImagePlan | None
    image_strategy: ImageStrategy | None

    schedule: PublishingSchedule | None
    publishing: PublishingResult | None

    analytics: CampaignAnalytics | None

    status: str | None
    errors: list[str]
    warnings: list[str]