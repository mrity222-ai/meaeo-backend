from __future__ import annotations

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class GoogleReviewOut(BaseModel):
    id: int
    location_name: str
    review_id: str
    reviewer_name: str
    reviewer_photo_url: str | None = None
    star_rating: int
    comment: str | None = None
    review_create_time: datetime | None = None
    reply_status: str
    reply_text: str | None = None
    replied_at: datetime | None = None
    sentiment: str | None = None
    seo_keywords_used: list[str] | None = None
    created_at: datetime


class GenerateReviewReplyRequest(BaseModel):
    review_id: int
    business_name: str | None = None
    city: str | None = None
    services: list[str] | None = None
    tone: str | None = "warm and professional"


class SendReviewReplyRequest(BaseModel):
    review_id: int
    reply_text: str


class GooglePostCreateRequest(BaseModel):
    location_name: str | None = None
    post_type: Literal["OFFER", "STANDARD", "EVENT"] = "OFFER"
    summary: str = Field(..., description="Post copy / description")
    offer_title: str | None = None
    coupon_code: str | None = None
    redeem_url: str | None = None
    terms_conditions: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    call_to_action_type: str | None = "LEARN_MORE"
    call_to_action_url: str | None = None
    media_url: str | None = None


class GenerateDailyOfferRequest(BaseModel):
    business_name: str | None = None
    industry: str | None = None
    city: str | None = None
    discount_target: str | None = None
    theme: str | None = "Special Promotion"


class GooglePostOut(BaseModel):
    id: int
    location_name: str
    post_type: str
    summary: str
    offer_title: str | None = None
    coupon_code: str | None = None
    redeem_url: str | None = None
    terms_conditions: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    call_to_action_type: str | None = None
    call_to_action_url: str | None = None
    media_url: str | None = None
    status: str
    google_post_id: str | None = None
    error_message: str | None = None
    created_at: datetime
    published_at: datetime | None = None


class OptimizeLocalSeoRequest(BaseModel):
    business_name: str
    industry: str
    city: str
    current_description: str | None = None
    current_services: list[str] | None = None


class OptimizeLocalSeoResponse(BaseModel):
    business_name: str
    city: str
    optimized_description: str
    target_keywords: list[str]
    recommended_services: list[dict]
    profile_completeness_score: int
    seo_checklist: list[dict]


class UpdateGbpDescriptionRequest(BaseModel):
    location_name: str
    description: str = Field(min_length=1, max_length=750)
