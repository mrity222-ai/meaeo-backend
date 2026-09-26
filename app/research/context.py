from pydantic import BaseModel, Field

from app.research.schemas import (
    AudienceResearch,
    BusinessResearch,
    IndustryResearch,
    ReviewResearch,
    SearchDocument,
    SeoResearch,
    TrendResearch,
)


class ResearchContext(BaseModel):

    business: BusinessResearch = Field(
        default_factory=BusinessResearch
    )
    industry: IndustryResearch = Field(
        default_factory=IndustryResearch
    )
    seo: SeoResearch = Field(
        default_factory=SeoResearch
    )
    trends: TrendResearch = Field(
        default_factory=TrendResearch
    )
    audience: AudienceResearch = Field(
        default_factory=AudienceResearch
    )
    reviews: ReviewResearch = Field(
        default_factory=ReviewResearch
    )
    citations: list[SearchDocument] = Field(
        default_factory=list
    )
    providers: list[str] = Field(
        default_factory=list
    )

    failed_providers: list[str] = Field(
        default_factory=list
    )

    successful_providers: list[str] = Field(
        default_factory=list
    )
    errors: list[str] = Field(
        default_factory=list
    )