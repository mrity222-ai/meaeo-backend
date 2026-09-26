from datetime import date, time

from pydantic import BaseModel, Field

from app.schemas.image import ImageSourceMode


class ScheduledPost(BaseModel):

    campaign_post_id: int | None = None
    day: int
    business_channel_id: int | None = None
    publish_date: date
    publish_time: time
    platforms: list[str]
    title: str
    caption: str
    hashtags: list[str] = Field(
        default_factory=list
    )
    image_path: str

    image_url: str | None = None

    image_source: ImageSourceMode = (
        ImageSourceMode.AI
    )

    call_to_action: str


class PublishingSchedule(BaseModel):

    campaign_name: str
    tenant_id: str | None = None
    business_account_id: int | None = None
    timezone: str = "UTC"
    posts: list[ScheduledPost] = Field(
        default_factory=list
    )