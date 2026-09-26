from pydantic import BaseModel, Field

from app.research.schemas import (
    AudienceResearch,
    BusinessResearch,
    IndustryResearch,
    ReviewResearch,
    SeoResearch,
    TrendResearch,
)


class ResearchResult(BaseModel):

    provider: str

    success: bool = True

    business: BusinessResearch | None = None
    industry: IndustryResearch | None = None
    seo: SeoResearch | None = None
    trends: TrendResearch | None = None
    audience: AudienceResearch | None = None
    reviews: ReviewResearch | None = None

    errors: list[str] = Field(
        default_factory=list
    )