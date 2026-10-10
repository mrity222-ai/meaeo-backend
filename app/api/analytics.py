from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database.models import CampaignPost, CampaignPostPublication
from app.analytics.providers.live import LiveAnalyticsProvider
from app.analytics.aggregator import AnalyticsAggregator
from app.schemas.publishing import PublishedPost, PublishingResult

from app.analytics.schemas import (
    CampaignAnalytics,
)
from app.database.session import get_db
from app.repositories.analytics_repository import (
    AnalyticsRepository,
)
from app.schemas.analytics_api import (
    AnalyticsHistoryResponse,
)
from app.security.dependencies import (
    get_current_tenant,
)
from app.security.tenant import TenantContext
from app.services.campaign_lifecycle_service import (
    CampaignLifecycleService,
)


router = APIRouter(
    prefix="/campaigns",
    tags=["analytics"],
)


def _get_campaign(
    db: Session,
    tenant: TenantContext,
    business_account_id: int,
    campaign_id: int,
):
    service = CampaignLifecycleService(db)

    try:
        campaign = service.get(
            tenant,
            business_account_id,
            campaign_id,
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found.",
        )

    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found.",
        )

    return campaign


@router.get(
    "/{campaign_id}/analytics",
    response_model=CampaignAnalytics,
)
def get_campaign_analytics(
    campaign_id: int,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    db: Session = Depends(get_db),
):

    campaign = _get_campaign(
        db,
        tenant,
        business_account_id,
        campaign_id,
    )

    rows = db.execute(select(CampaignPostPublication, CampaignPost).join(
        CampaignPost, CampaignPost.id == CampaignPostPublication.campaign_post_id).where(
        CampaignPost.campaign_id == campaign.id, CampaignPost.tenant_id == tenant.tenant_id,
        CampaignPostPublication.tenant_id == tenant.tenant_id,
        CampaignPostPublication.status == "published")).all()
    publishing = PublishingResult(posts=[PublishedPost(platform=publication.platform, day=post.day,
        title=post.title, status="published", external_id=publication.external_id or "",
        image_path=post.image_path or "", published_at=publication.completed_at)
        for publication, post in rows])
    result = LiveAnalyticsProvider(tenant_id=tenant.tenant_id, db=db, campaign_id=campaign.id,
        business_account_id=business_account_id).collect(campaign.campaign_name, publishing)
    analytics = AnalyticsAggregator.aggregate(campaign.campaign_name, result.posts)
    analytics.campaign_id = campaign.id
    if result.success:
        AnalyticsRepository().save_verified(tenant.tenant_id, campaign.id, analytics)
    return analytics


@router.get(
    "/{campaign_id}/analytics/history",
    response_model=AnalyticsHistoryResponse,
)
def get_campaign_analytics_history(
    campaign_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    db: Session = Depends(get_db),
):

    campaign = _get_campaign(
        db,
        tenant,
        business_account_id,
        campaign_id,
    )

    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "start_date cannot be after end_date"
            ),
        )

    repository = AnalyticsRepository()

    snapshots = repository.load_verified_range(
        tenant_id=tenant.tenant_id,
        campaign_id=campaign.id,
        start_date=start_date,
        end_date=end_date,
    )

    return AnalyticsHistoryResponse(
        campaign_name=campaign.campaign_name,
        start_date=start_date,
        end_date=end_date,
        snapshots=snapshots,
    )