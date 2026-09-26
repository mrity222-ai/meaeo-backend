from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.agents.gbp_offer_generator import GoogleBusinessOfferAgent
from app.database.models import (
    BusinessChannel,
    BusinessProfile,
    GoogleBusinessPost,
    GoogleBusinessReview,
    UserTenant,
)
from app.schemas.google_business import (
    GenerateDailyOfferRequest,
    GenerateReviewReplyRequest,
    GooglePostCreateRequest,
    GooglePostOut,
    GoogleReviewOut,
    OptimizeLocalSeoRequest,
    OptimizeLocalSeoResponse,
    SendReviewReplyRequest,
    UpdateGbpDescriptionRequest,
)
from app.security.authentication import AuthenticatedUser
from app.security.dependencies import get_current_user
from app.security.tenant import TenantContext
from app.services.google_reviews_service import GoogleBusinessService


router = APIRouter(
    prefix="/google-business",
    tags=["google_business"],
)


def resolve_tenant(
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-ID"),
    tenant_param: str | None = Query(default=None, alias="tenant_id"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TenantContext:
    target_tenant_id = x_tenant_id or tenant_param
    if not target_tenant_id:
        membership = db.scalar(
            select(UserTenant).where(
                UserTenant.user_id == current_user.user_id,
                UserTenant.is_active.is_(True),
            )
        )
        if membership and membership.tenant:
            target_tenant_id = membership.tenant.tenant_id

    if not target_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required",
        )

    return TenantContext(tenant_id=target_tenant_id)


# -------------------------------------------------------------
# 1. Google Business Reviews & AI SEO Responder
# -------------------------------------------------------------

@router.get("/reviews", response_model=list[GoogleReviewOut])
async def list_reviews(
    location_name: str | None = Query(default=None),
    tenant: TenantContext = Depends(resolve_tenant),
    db: Session = Depends(get_db),
):
    """
    Get all Google Business Profile reviews for the active business.
    Synchronizes with Google My Business API if credentials are connected.
    """
    service = GoogleBusinessService()
    reviews = await service.fetch_and_sync_reviews(
        db=db,
        tenant_id=tenant.tenant_id,
        location_name=location_name,
    )
    return reviews


@router.get("/status")
async def get_connection_status(
    tenant: TenantContext = Depends(resolve_tenant),
    db: Session = Depends(get_db),
):
    """
    Check if the active tenant has an authenticated Google Business Profile channel connected.
    Also returns the active business name and city from BusinessProfile.
    """
    channel_stmt = select(BusinessChannel).where(
        BusinessChannel.tenant_id == tenant.tenant_id,
        BusinessChannel.platform == "google_business",
        BusinessChannel.status == "active",
    )
    channel = db.scalars(channel_stmt).first()

    prof_stmt = select(BusinessProfile).where(BusinessProfile.tenant_id == tenant.tenant_id)
    profile = db.scalars(prof_stmt).first()

    return {
        "is_connected": channel is not None,
        "channel_id": channel.id if channel else None,
        "external_account_id": channel.external_account_id if channel else None,
        "business_name": profile.business_name if profile else "My Business",
        "city": profile.city if profile and profile.city else "My City",
        "category": profile.category if profile else "General",
    }


@router.post("/reviews/generate-reply", response_model=GoogleReviewOut)
async def generate_review_reply(
    payload: GenerateReviewReplyRequest,
    tenant: TenantContext = Depends(resolve_tenant),
    db: Session = Depends(get_db),
):
    """
    Generate an AI-powered Local SEO review response that weaves in the
    Business Name, City, and key services to maximize Google Maps ranking.
    """
    service = GoogleBusinessService()
    try:
        updated_rev = await service.generate_reply(
            db=db,
            tenant_id=tenant.tenant_id,
            review_record_id=payload.review_id,
            business_name=payload.business_name,
            city=payload.city,
            services=payload.services,
            tone=payload.tone,
        )
        return updated_rev
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate reply: {str(e)}")


@router.post("/reviews/send-reply", response_model=GoogleReviewOut)
async def send_review_reply(
    payload: SendReviewReplyRequest,
    tenant: TenantContext = Depends(resolve_tenant),
    db: Session = Depends(get_db),
):
    """
    Publishes the approved review reply directly to Google My Business API.
    """
    service = GoogleBusinessService()
    try:
        updated_rev = await service.send_reply_to_google(
            db=db,
            tenant_id=tenant.tenant_id,
            review_record_id=payload.review_id,
            reply_text=payload.reply_text,
        )
        return updated_rev
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to publish reply: {str(e)}")


# -------------------------------------------------------------
# 2. Daily Promotional Offers & Local Posts
# -------------------------------------------------------------

@router.post("/offers/generate")
async def generate_daily_offer(
    payload: GenerateDailyOfferRequest,
    tenant: TenantContext = Depends(resolve_tenant),
):
    """
    AI-generates high-converting Promotional Offer copy, catchy headline,
    coupon code, and CTA for Google Business Profile Local Posts.
    """
    agent = GoogleBusinessOfferAgent()
    offer = await agent.generate_offer(
        business_name=payload.business_name or "Our Business",
        industry=payload.industry or "General Services",
        city=payload.city or "City",
        theme=payload.theme,
        discount_target=payload.discount_target,
    )
    return offer


@router.post("/offers/publish", response_model=GooglePostOut)
async def publish_local_post(
    payload: GooglePostCreateRequest,
    tenant: TenantContext = Depends(resolve_tenant),
    db: Session = Depends(get_db),
):
    """
    Publishes a promotional offer, event, or standard update post directly to GBP.
    """
    service = GoogleBusinessService()
    try:
        post = await service.publish_local_post(
            db=db,
            tenant_id=tenant.tenant_id,
            post_data=payload,
        )
        return post
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to post to Google Business: {str(e)}")


@router.get("/offers", response_model=list[GooglePostOut])
async def list_local_posts(
    tenant: TenantContext = Depends(resolve_tenant),
    db: Session = Depends(get_db),
):
    """
    Lists all promotional offers and local updates posted to Google Business Profile.
    """
    stmt = (
        select(GoogleBusinessPost)
        .where(GoogleBusinessPost.tenant_id == tenant.tenant_id)
        .order_by(GoogleBusinessPost.created_at.desc())
    )
    return list(db.scalars(stmt).all())


# -------------------------------------------------------------
# 3. GBP Local SEO Keyword Optimizer & Description Updates
# -------------------------------------------------------------

@router.post("/seo/optimize", response_model=OptimizeLocalSeoResponse)
async def optimize_local_seo(
    payload: OptimizeLocalSeoRequest,
    tenant: TenantContext = Depends(resolve_tenant),
):
    """
    Analyzes business profile and crafts a complete Local SEO package:
    - 500-750 char Google Maps ranking description
    - 10+ high-intent local search keywords
    - Recommended sub-services for Google Maps ranking
    - Profile completeness score and action checklist
    """
    agent = GoogleBusinessSeoOptimizerAgent()
    seo_res = await agent.optimize(
        business_name=payload.business_name,
        industry=payload.industry,
        city=payload.city,
        current_description=payload.current_description,
        current_services=payload.current_services,
    )
    return seo_res


@router.post("/profile/update-description")
async def update_profile_description(
    payload: UpdateGbpDescriptionRequest,
    tenant: TenantContext = Depends(resolve_tenant),
    db: Session = Depends(get_db),
):
    """
    Pushes the optimized business description directly to Google Business Profile.
    """
    service = GoogleBusinessService()
    res = await service.update_profile_description(
        db=db,
        tenant_id=tenant.tenant_id,
        location_name=payload.location_name,
        description=payload.description,
    )
    return res
