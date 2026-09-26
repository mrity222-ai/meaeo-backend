from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.image import ImageSourceMode


class PublishedPost(BaseModel):

    platform: str
    account: str = "default"
    day: int
    title: str
    status: str
    external_id: str
    url: str | None = None
    scheduled_for: datetime | None = None
    published_at: datetime | None = None
    image_path: str

    image_source: ImageSourceMode = (
        ImageSourceMode.AI
    )

    errors: list[str] = Field(
        default_factory=list
    )


class PublishingResult(BaseModel):

    posts: list[PublishedPost] = Field(
        default_factory=list
    )
    successful: int = 0
    failed: int = 0
    provider: str = ""