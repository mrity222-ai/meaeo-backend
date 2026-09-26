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


class Competitor(BaseModel):
    name: str
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)


class AudienceInsight(BaseModel):
    pain_points: list[str] = Field(default_factory=list)
    motivations: list[str] = Field(default_factory=list)
    objections: list[str] = Field(default_factory=list)


class PlatformInsight(BaseModel):
    platform: str
    best_practices: list[str] = Field(default_factory=list)


class ResearchReport(BaseModel):

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
    recommendations: list[str] = Field(
        default_factory=list
    )
    priority_actions: list[str] = Field(
        default_factory=list
    )
    campaign_risks: list[str] = Field(
        default_factory=list
    )
    content_angles: list[str] = Field(
        default_factory=list
    )
    citations: list[SearchDocument] = Field(
        default_factory=list
    )