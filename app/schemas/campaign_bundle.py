from typing import Any
from pydantic import BaseModel, Field

from app.schemas.brand import BrandProfile
from app.schemas.campaign_metadata import CampaignMetadata
from app.schemas.campaign_spec import CampaignSpec
from app.schemas.content import ContentPlan
from app.schemas.image import ImagePlan
from app.schemas.research import ResearchReport
from app.schemas.strategy import MarketingStrategy


class CampaignBundle(BaseModel):

    campaign: CampaignSpec
    brand: Any
    research: ResearchReport
    strategy: MarketingStrategy
    content: ContentPlan
    images: ImagePlan

    metadata: CampaignMetadata = Field(
        default_factory=CampaignMetadata
    )