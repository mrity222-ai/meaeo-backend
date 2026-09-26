from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.orm import Session

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

    repository = AnalyticsRepository()

    analytics = repository.latest(
        tenant_id=tenant.tenant_id,
        campaign_name=campaign.campaign_name,
    )

    if analytics is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analytics not found.",
        )

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

    snapshots = repository.load_range(
        tenant_id=tenant.tenant_id,
        campaign_name=campaign.campaign_name,
        start_date=start_date,
        end_date=end_date,
    )

    return AnalyticsHistoryResponse(
        campaign_name=campaign.campaign_name,
        start_date=start_date,
        end_date=end_date,
        snapshots=snapshots,
    )