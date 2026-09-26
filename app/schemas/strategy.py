from pydantic import BaseModel, Field


class MarketingStrategy(BaseModel):

    positioning: str = Field(...)
    unique_value_proposition: str = Field(...)
    primary_audience: str = Field(...)
    secondary_audience: list[str] = Field(default_factory=list)
    messaging_pillars: list[str] = Field(default_factory=list)
    content_themes: list[str] = Field(default_factory=list)
    recommended_channels: list[str] = Field(default_factory=list)
    content_frequency: str = Field(
        default=""
    )
    campaign_objective: str = Field(
        default=""
    )
    tone_of_voice: list[str] = Field(default_factory=list)
    call_to_action: str = Field(...)
    success_metrics: list[str] = Field(default_factory=list)