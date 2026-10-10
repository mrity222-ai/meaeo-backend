from __future__ import annotations
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.agents.gbp_offer_generator import GoogleBusinessOfferAgent
from app.agents.gbp_seo_optimizer import GoogleBusinessSeoOptimizerAgent
from app.database.models import (
    BusinessProfile,
    GoogleBusinessPost,
    BusinessAccount,
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
from app.security.dependencies import get_current_tenant
from app.security.tenant import TenantContext
from app.services.google_reviews_service import GoogleBusinessService


router = APIRouter(
    prefix="/google-business",
    tags=["google_business"],
)


@router.get("/performance")
async def get_performance(
    start_date: date = Query(...),
    end_date: date = Query(...),
    location_name: str | None = Query(default=None),
    tenant: TenantContext = Depends(get_current_tenant),
    business_account_id: int = Query(..., gt=0),
    db: Session = Depends(get_db),
):
    selected_business(business_account_id, tenant, db)
    result = await GoogleBusinessService(business_account_id=business_account_id).fetch_performance(
        db, tenant.tenant_id, start_date, end_date, location_name)
    from app.repositories.analytics_repository import AnalyticsRepository
    AnalyticsRepository().save_profile_performance(tenant.tenant_id, business_account_id, result)
    return result


def selected_business(
    business_account_id: int = Query(..., gt=0),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> int:
    business = db.scalar(select(BusinessAccount).where(
        BusinessAccount.id == business_account_id,
        BusinessAccount.tenant_id == tenant.tenant_id,
        BusinessAccount.status == "active",
    ))
    if business is None:
        raise HTTPException(404, "Active business not found for this tenant")
    return business.id


# -------------------------------------------------------------
# 1. Google Business Reviews & AI SEO Responder
# -------------------------------------------------------------

@router.get("/reviews", response_model=list[GoogleReviewOut])
async def list_reviews(
    location_name: str | None = Query(default=None),
    tenant: TenantContext = Depends(get_current_tenant),
    business_account_id: int = Depends(selected_business),
    db: Session = Depends(get_db),
):
    """
    Get all Google Business Profile reviews for the active business.
    Synchronizes with Google My Business API if credentials are connected.
    """
    service = GoogleBusinessService(business_account_id=business_account_id)
    reviews = await service.fetch_and_sync_reviews(
        db=db,
        tenant_id=tenant.tenant_id,
        location_name=location_name,
    )
    return reviews


@router.get("/status")
async def get_connection_status(
    tenant: TenantContext = Depends(get_current_tenant),
    business_account_id: int = Depends(selected_business),
    db: Session = Depends(get_db),
):
    """
    Check if the active tenant has an authenticated Google Business Profile channel connected.
    Also returns the active business name and city from BusinessProfile.
    """
    service = GoogleBusinessService(business_account_id=business_account_id)
    channel, location, token = await service._get_channel_and_credential(db, tenant.tenant_id)

    prof_stmt = select(BusinessProfile).where(BusinessProfile.tenant_id == tenant.tenant_id, BusinessProfile.business_account_id == business_account_id)
    profile = db.scalars(prof_stmt).first()

    return {
        "is_connected": channel is not None and bool(token),
        "channel_id": channel.id if channel else None,
        "external_account_id": channel.external_account_id if channel else None,
        "business_name": profile.business_name if profile else "My Business",
        "city": profile.city if profile and profile.city else "My City",
        "category": profile.category if profile else "General",
    }


@router.post("/reviews/generate-reply", response_model=GoogleReviewOut)
async def generate_review_reply(
    payload: GenerateReviewReplyRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    business_account_id: int = Depends(selected_business),
    db: Session = Depends(get_db),
):
    """
    Generate an AI-powered Local SEO review response that weaves in the
    Business Name, City, and key services to maximize Google Maps ranking.
    """
    service = GoogleBusinessService(business_account_id=business_account_id)
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate reply: {str(e)}")


@router.post("/reviews/send-reply", response_model=GoogleReviewOut)
async def send_review_reply(
    payload: SendReviewReplyRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    business_account_id: int = Depends(selected_business),
    db: Session = Depends(get_db),
):
    """
    Publishes the approved review reply directly to Google My Business API.
    """
    service = GoogleBusinessService(business_account_id=business_account_id)
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to publish reply: {str(e)}")


# -------------------------------------------------------------
# 2. Daily Promotional Offers & Local Posts
# -------------------------------------------------------------

@router.post("/offers/generate")
async def generate_daily_offer(
    payload: GenerateDailyOfferRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    business_account_id: int = Depends(selected_business),
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
    tenant: TenantContext = Depends(get_current_tenant),
    business_account_id: int = Depends(selected_business),
    db: Session = Depends(get_db),
):
    """
    Publishes a promotional offer, event, or standard update post directly to GBP.
    """
    service = GoogleBusinessService(business_account_id=business_account_id)
    try:
        post = await service.publish_local_post(
            db=db,
            tenant_id=tenant.tenant_id,
            post_data=payload,
        )
        return post
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to post to Google Business: {str(e)}")


@router.get("/offers", response_model=list[GooglePostOut])
async def list_local_posts(
    tenant: TenantContext = Depends(get_current_tenant),
    business_account_id: int = Depends(selected_business),
    db: Session = Depends(get_db),
):
    """
    Lists all promotional offers and local updates posted to Google Business Profile.
    """
    channels = GoogleBusinessService(business_account_id=business_account_id).owned_channels(db, tenant.tenant_id)
    stmt = (
        select(GoogleBusinessPost)
        .where(GoogleBusinessPost.tenant_id == tenant.tenant_id,
               GoogleBusinessPost.business_channel_id.in_([c.id for c in channels]),
               GoogleBusinessPost.location_name.in_([c.external_account_id for c in channels]))
        .order_by(GoogleBusinessPost.created_at.desc())
    )
    return list(db.scalars(stmt).all())


# -------------------------------------------------------------
# 3. GBP Local SEO Keyword Optimizer & Description Updates
# -------------------------------------------------------------

@router.post("/seo/optimize", response_model=OptimizeLocalSeoResponse)
async def optimize_local_seo(
    payload: OptimizeLocalSeoRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    business_account_id: int = Depends(selected_business),
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
    tenant: TenantContext = Depends(get_current_tenant),
    business_account_id: int = Depends(selected_business),
    db: Session = Depends(get_db),
):
    """
    Pushes the optimized business description directly to Google Business Profile.
    """
    service = GoogleBusinessService(business_account_id=business_account_id)
    res = await service.update_profile_description(
        db=db,
        tenant_id=tenant.tenant_id,
        location_name=payload.location_name,
        description=payload.description,
    )
    return res
