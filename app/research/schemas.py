from pydantic import BaseModel, Field


class SearchDocument(BaseModel):

    title: str = ""
    content: str = ""
    url: str = ""
    source: str = ""



class BusinessResearch(BaseModel):

    business_name: str = ""
    website: str = ""
    title: str = ""
    summary: str = ""
    industry: str = ""
    services: list[str] = Field(default_factory=list)
    products: list[str] = Field(default_factory=list)
    target_audience: list[str] = Field(default_factory=list)
    usp: str = ""
    brand_voice: str = ""
    pricing: str = ""
    faqs: list[str] = Field(default_factory=list)
    testimonials: list[str] = Field(default_factory=list)
    locations: list[str] = Field(default_factory=list)



class CompetitorResearch(BaseModel):

    name: str = ""
    website: str = ""
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)


class IndustryResearch(BaseModel):

    summary: str = ""
    trends: list[str] = Field(default_factory=list)
    opportunities: list[str] = Field(default_factory=list)
    competitors: list[CompetitorResearch] = Field(
        default_factory=list
    )
    references: list[SearchDocument] = Field(
        default_factory=list
    )


class SeoResearch(BaseModel):

    primary_keywords: list[str] = Field(default_factory=list)
    secondary_keywords: list[str] = Field(default_factory=list)
    long_tail_keywords: list[str] = Field(default_factory=list)
    search_intent: list[str] = Field(default_factory=list)



class AudienceResearch(BaseModel):

    pain_points: list[str] = Field(default_factory=list)
    motivations: list[str] = Field(default_factory=list)
    objections: list[str] = Field(default_factory=list)
    common_questions: list[str] = Field(default_factory=list)
    emotional_triggers: list[str] = Field(default_factory=list)


class TrendResearch(BaseModel):

    trending_topics: list[str] = Field(default_factory=list)
    seasonal_topics: list[str] = Field(default_factory=list)
    local_events: list[str] = Field(default_factory=list)
    industry_events: list[str] = Field(default_factory=list)


class ReviewResearch(BaseModel):

    positives: list[str] = Field(default_factory=list)
    negatives: list[str] = Field(default_factory=list)
    recurring_feedback: list[str] = Field(default_factory=list)