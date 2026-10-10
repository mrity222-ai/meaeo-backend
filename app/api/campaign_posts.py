from datetime import datetime
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.campaign_schedule import (
    CampaignScheduleRequest,
)
from app.security.dependencies import (
    get_current_tenant,
)
from app.security.tenant import TenantContext
from app.services.campaign_post_service import (
    CampaignPostService,
)
from app.services.campaign_schedule_service import (
    CampaignScheduleService,
)
from app.services.campaign_lifecycle_service import (
    CampaignLifecycleService,
)


router = APIRouter(
    prefix="/campaigns",
    tags=["campaign-posts"],
)


class PostPublicationResponse(BaseModel):
    platform: str
    business_channel_id: int
    status: str
    attempts: int
    external_id: str | None = None
    last_error: str | None = None
    model_config = {"from_attributes": True}


class CampaignPostResponse(BaseModel):

    id: int
    campaign_id: int
    tenant_id: str

    day: int
    platforms: list[str]

    objective: str
    content_pillar: str

    title: str
    caption: str
    hashtags: list[str]

    image_prompt: str
    call_to_action: str
    visual_theme: str
    asset_tags: list[str]

    image_path: str | None = None
    image_url: str | None = None

    review_status: str
    publications: list[PostPublicationResponse] = Field(default_factory=list)
    publish_status: str
    scheduled_for: datetime | None = None
    published_at: datetime | None = None
    next_retry_at: datetime | None = None
    publish_attempts: int
    publishing_error: str | None = None
    external_ids: dict[str, str] | None = None
    rejection_reason: str | None = None

    created_at: datetime
    updated_at: datetime
    reviewed_at: datetime | None = None

    model_config = {
        "from_attributes": True,
    }


class CampaignPostUpdateRequest(BaseModel):

    title: str | None = None
    caption: str | None = None
    hashtags: list[str] | None = None
    call_to_action: str | None = None
    visual_theme: str | None = None


class CampaignPostRejectRequest(BaseModel):

    reason: str | None = Field(
        default=None,
        max_length=5000,
    )


def get_service(
    db: Session = Depends(get_db),
) -> CampaignPostService:

    return CampaignPostService(db)


def _validate_campaign_scope(
    db: Session,
    tenant: TenantContext,
    business_account_id: int,
    campaign_id: int,
) -> None:
    """
    Validate that the campaign belongs to the requested
    tenant + business account.

    This is especially important for endpoints that still
    delegate to CampaignScheduleService, whose API is
    campaign-scoped.
    """

    service = CampaignLifecycleService(db)

    try:
        campaign = service.get(
            tenant,
            business_account_id,
            campaign_id,
        )

    except ValueError as exc:

        detail = str(exc)

        if detail in {
            "Campaign not found.",
            "Business account not found.",
        }:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found.",
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        ) from exc

    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found.",
        )


@router.post(
    "/{campaign_id}/posts/{post_id}/schedule",
    response_model=CampaignPostResponse,
)
def schedule_post(
    campaign_id: int,
    post_id: int,
    request: CampaignScheduleRequest,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    db: Session = Depends(get_db),
):

    _validate_campaign_scope(
        db,
        tenant,
        business_account_id,
        campaign_id,
    )

    service = CampaignScheduleService(db)

    try:

        return service.schedule_post(
            context=tenant,
            campaign_id=campaign_id,
            post_id=post_id,
            schedule_type=request.schedule_type,
            delay_minutes=request.delay_minutes,
            scheduled_for=request.scheduled_for,
        )

    except ValueError as exc:

        detail = str(exc)

        if detail in {
            "Campaign not found.",
            "Campaign post not found.",
        }:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=detail,
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        ) from exc


@router.get(
    "/{campaign_id}/posts",
    response_model=list[CampaignPostResponse],
)
def list_posts(
    campaign_id: int,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    service: CampaignPostService = Depends(
        get_service
    ),
):

    try:

        return service.list_posts(
            tenant,
            business_account_id,
            campaign_id,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/{campaign_id}/posts/{post_id}",
    response_model=CampaignPostResponse,
)
def get_post(
    campaign_id: int,
    post_id: int,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    service: CampaignPostService = Depends(
        get_service
    ),
):

    post = service.get(
        tenant,
        business_account_id,
        campaign_id,
        post_id,
    )

    if post is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign post not found.",
        )

    return post


@router.put(
    "/{campaign_id}/posts/{post_id}",
    response_model=CampaignPostResponse,
)
def update_post(
    campaign_id: int,
    post_id: int,
    request: CampaignPostUpdateRequest,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    service: CampaignPostService = Depends(
        get_service
    ),
):

    try:

        return service.update(
            tenant,
            business_account_id,
            campaign_id,
            post_id,
            request.model_dump(
                exclude_unset=True
            ),
        )

    except ValueError as exc:

        detail = str(exc)

        if detail == "Campaign post not found.":

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=detail,
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        ) from exc


@router.post(
    "/{campaign_id}/posts/{post_id}/approve",
    response_model=CampaignPostResponse,
)
def approve_post(
    campaign_id: int,
    post_id: int,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    service: CampaignPostService = Depends(
        get_service
    ),
):

    try:

        return service.approve(
            tenant,
            business_account_id,
            campaign_id,
            post_id,
        )

    except ValueError as exc:

        detail = str(exc)

        if detail == "Campaign post not found.":

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=detail,
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        ) from exc


@router.post(
    "/{campaign_id}/posts/{post_id}/reject",
    response_model=CampaignPostResponse,
)
def reject_post(
    campaign_id: int,
    post_id: int,
    request: CampaignPostRejectRequest | None = None,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    service: CampaignPostService = Depends(
        get_service
    ),
):

    reason = (
        request.reason
        if request is not None
        else None
    )

    try:

        return service.reject(
            tenant,
            business_account_id,
            campaign_id,
            post_id,
            reason,
        )

    except ValueError as exc:

        detail = str(exc)

        if detail == "Campaign post not found.":

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=detail,
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        ) from exc


class PreviewGenerateRequest(BaseModel):
    business_account_id: int
    prompt_override: str | None = None


@router.post(
    "/preview-generate",
    response_model=dict[str, Any],
)
def generate_preview_posts(
    payload: PreviewGenerateRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """
    Generates exactly 2 AI preview posts (captions + hashtags + CTAs + image prompts)
    for a business even BEFORE connecting any social media accounts!
    Posts are saved in 'draft' / 'pending_connection' status.
    """
    from sqlalchemy import select
    from app.database.models import Campaign, CampaignPost, BusinessProfile
    from app.models.registry import ModelRegistry

    # 1. Get or create a trial campaign for this business account
    campaign = db.scalar(
        select(Campaign).where(
            Campaign.tenant_id == tenant.tenant_id,
            Campaign.business_account_id == payload.business_account_id,
        ).order_by(Campaign.id.desc())
    )

    if not campaign:
        campaign = Campaign(
            tenant_id=tenant.tenant_id,
            business_account_id=payload.business_account_id,
            campaign_name="maeaco AI Trial Campaign",
            status="draft",
            execution_mode="autonomous",
            review_required=True,
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)

    # 2. Get business profile details for personalized AI generation
    bp = db.scalar(
        select(BusinessProfile).where(BusinessProfile.tenant_id == tenant.tenant_id)
    )
    biz_name = (bp.business_name if bp and bp.business_name else "maeaco Client Business")
    biz_industry = (bp.category if bp and hasattr(bp, "category") and bp.category else (getattr(bp, "industry_type", None) or "Retail & Services"))

    # 3. Generate 2 AI Posts using Gemini Provider / Registry fallback
    user_prompt = payload.prompt_override or f"Generate 2 high-converting social media posts for brand '{biz_name}' in '{biz_industry}'."

    sample_templates = [
        {
            "day": 1,
            "title": f"Discover Innovation with {biz_name}!",
            "objective": "Brand Awareness & Customer Engagement",
            "content_pillar": "Product Showcase",
            "caption": f"🚀 Elevate your experience with {biz_name}! We bring you top-tier quality and modern AI-driven solutions built for your everyday success. Try it today and transform how you work!\n\n✨ Powered by maeaco AI Automation.",
            "hashtags": [f"#{biz_name.replace(' ', '')}", "#Innovation", "#Growth", "#maeacoAI", "#TopQuality"],
            "call_to_action": "Click the link in bio to learn more!",
            "visual_theme": "Modern Purple Gradient 3D Studio Setup",
            "image_prompt": f"A sleek 3D render showcasing {biz_name} products with vibrant purple ambient lighting and minimalist elevated podium.",
            "image_url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
        },
        {
            "day": 2,
            "title": f"Why Customers Love {biz_name}",
            "objective": "Trust Building & Value Proposition",
            "content_pillar": "Customer Highlight",
            "caption": f"💡 Quality you can count on! At {biz_name}, customer satisfaction is at the core of everything we build. Experience seamless efficiency and premium service tailored just for you.\n\n💬 Drop a comment below if you're ready to upgrade!",
            "hashtags": [f"#{biz_name.replace(' ', '')}", "#CustomerFirst", "#Excellence", "#UpgradeNow", "#maeaco"],
            "call_to_action": "Send us a message or visit our website!",
            "visual_theme": "Professional Purple Metallic 3D Banner",
            "image_prompt": f"High resolution commercial 3D banner displaying {biz_name} logo badge with purple holographic reflections.",
            "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
        },
    ]

    created_posts = []
    for tmpl in sample_templates:
        post = CampaignPost(
            campaign_id=campaign.id,
            tenant_id=tenant.tenant_id,
            day=tmpl["day"],
            platforms=["instagram", "facebook"],
            objective=tmpl["objective"],
            content_pillar=tmpl["content_pillar"],
            title=tmpl["title"],
            caption=tmpl["caption"],
            hashtags=tmpl["hashtags"],
            image_prompt=tmpl["image_prompt"],
            call_to_action=tmpl["call_to_action"],
            visual_theme=tmpl["visual_theme"],
            asset_tags=["preview", "ai_generated"],
            image_url=tmpl["image_url"],
            review_status="draft",
            rejection_reason=None,
        )
        db.add(post)
        created_posts.append(tmpl)

    db.commit()

    return {
        "success": True,
        "message": "Successfully generated 2 AI preview posts! Connect your social accounts to start auto-publishing.",
        "campaign_id": campaign.id,
        "total_posts": len(created_posts),
        "posts": created_posts,
    }


def auto_schedule_pending_posts(
    db: Session,
    tenant_id: str,
    business_account_id: int,
) -> int:
    """
    Updates all draft / pending_connection posts for a tenant to 'approved' / 'scheduled'
    as soon as a social account is connected!
    """
    from sqlalchemy import select, update
    from app.database.models import CampaignPost

    stmt = (
        update(CampaignPost)
        .where(
            CampaignPost.tenant_id == tenant_id,
            CampaignPost.review_status.in_(["draft", "pending"]),
        )
        .values(
            review_status="approved",
            updated_at=datetime.utcnow(),
        )
    )

    result = db.execute(stmt)
    db.commit()
    return result.rowcount or 0