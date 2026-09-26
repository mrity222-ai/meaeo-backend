from pydantic import BaseModel, Field


class RawResearch(BaseModel):

    business: dict = Field(default_factory=dict)
    industry: dict = Field(default_factory=dict)
    trends: dict = Field(default_factory=dict)