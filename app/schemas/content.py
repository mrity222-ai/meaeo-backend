from typing import Literal

from pydantic import BaseModel, Field


PostReviewStatus = Literal[
    "pending",
    "approved",
    "rejected",
]


class ContentPost(BaseModel):

    day: int
    platforms: list[str]
    objective: str
    content_pillar: str
    title: str
    caption: str
    hashtags: list[str]
    image_prompt: str

    call_to_action: str = ""

    visual_theme: str = ""

    asset_tags: list[str] = Field(
        default_factory=list
    )

    # Review state used by the human-intervention
    # workflow. Autonomous campaigns can remain
    # pending because they do not require review.
    review_status: PostReviewStatus = (
        "pending"
    )


class ContentPlan(BaseModel):

    duration_days: int
    campaign_summary: str
    posts: list[ContentPost]