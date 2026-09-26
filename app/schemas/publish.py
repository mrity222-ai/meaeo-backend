from datetime import datetime

from pydantic import BaseModel, Field


class PublishRequest(BaseModel):

    campaign_name: str
    platform: str
    account: str = "default"
    day: int
    title: str
    caption: str
    hashtags: list[str] = Field(
        default_factory=list
    )
    image_path: str
    publish_at: datetime | None = None
    metadata: dict = Field(
        default_factory=dict
    )