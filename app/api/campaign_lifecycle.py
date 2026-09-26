from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.campaign_lifecycle import (
    CampaignCreateRequest,
    CampaignResponse,
)
from app.schemas.campaign_schedule import (
    CampaignScheduleRequest,
    CampaignScheduleResponse,
)
from app.security.dependencies import (
    get_current_tenant,
)
from app.security.tenant import TenantContext
from app.services.campaign_lifecycle_service import (
    CampaignLifecycleService,
)
from app.services.campaign_schedule_service import (
    CampaignScheduleService,
)
from app.services.campaign_post_service import (
    CampaignPostService,
)
from app.graph.runner import GraphRunner


router = APIRouter(
    prefix="/campaigns",
    tags=["campaign-lifecycle"],
)


def get_service(
    db: Session = Depends(get_db),
) -> CampaignLifecycleService:
    return CampaignLifecycleService(db)


def _get_campaign_or_404(
    service: CampaignLifecycleService,
    tenant: TenantContext,
    business_account_id: int,
    campaign_id: int,
):
    """
    Retrieve a campaign within the authenticated
    tenant + business-account scope.

    Any tenant/business-account validation failure
    is deliberately converted to HTTP 404 so that
    cross-tenant resources are not exposed.
    """

    try:
        campaign = service.get(
            tenant,
            business_account_id,
            campaign_id,
        )

    except ValueError as exc:
        detail = str(exc)

        # Do not expose whether a business account exists
        # under another tenant.
        if detail == "Business account not found.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found.",
            ) from exc

        if detail == "Campaign not found.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=detail,
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

    return campaign


@router.get(
    "",
    response_model=list[CampaignResponse],
)
def list_campaigns(
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    service: CampaignLifecycleService = Depends(
        get_service
    ),
):
    return service.list(
        tenant,
        business_account_id,
    )


@router.get(
    "/{campaign_id}",
    response_model=CampaignResponse,
)
def get_campaign(
    campaign_id: int,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    service: CampaignLifecycleService = Depends(
        get_service
    ),
):
    return _get_campaign_or_404(
        service,
        tenant,
        business_account_id,
        campaign_id,
    )


@router.post(
    "",
    response_model=CampaignResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_campaign(
    request: CampaignCreateRequest,
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    service: CampaignLifecycleService = Depends(
        get_service
    ),
):
    try:
        return service.create(
            context=tenant,
            business_account_id=request.business_account_id,
            campaign_name=request.campaign_name,
            execution_mode=request.execution_mode,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{campaign_id}/schedule",
    response_model=CampaignScheduleResponse,
)
def schedule_campaign(
    campaign_id: int,
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
    lifecycle_service = CampaignLifecycleService(db)

    _get_campaign_or_404(
        lifecycle_service,
        tenant,
        business_account_id,
        campaign_id,
    )

    service = CampaignScheduleService(db)

    try:
        posts = service.schedule(
            context=tenant,
            campaign_id=campaign_id,
            schedule_type=request.schedule_type,
            delay_minutes=request.delay_minutes,
            scheduled_for=request.scheduled_for,
        )

    except ValueError as exc:
        detail = str(exc)

        if detail == "Campaign not found.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=detail,
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        ) from exc

    return CampaignScheduleResponse(
        campaign_id=campaign_id,
        campaign_status="running",
        scheduled_posts=len(posts),
        first_scheduled_for=posts[0].scheduled_for,
        last_scheduled_for=posts[-1].scheduled_for,
    )


@router.post(
    "/{campaign_id}/start",
    response_model=CampaignResponse,
)
def start_campaign(
    campaign_id: int,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    service: CampaignLifecycleService = Depends(
        get_service
    ),
):
    try:
        return service.start(
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
                detail=(
                    "Campaign not found."
                    if detail == "Business account not found."
                    else detail
                ),
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        ) from exc


@router.post(
    "/{campaign_id}/pause",
    response_model=CampaignResponse,
)
def pause_campaign(
    campaign_id: int,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    service: CampaignLifecycleService = Depends(
        get_service
    ),
):
    try:
        return service.pause(
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
                detail=(
                    "Campaign not found."
                    if detail == "Business account not found."
                    else detail
                ),
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        ) from exc


@router.post(
    "/{campaign_id}/complete",
    response_model=CampaignResponse,
)
def complete_campaign(
    campaign_id: int,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    service: CampaignLifecycleService = Depends(
        get_service
    ),
):
    try:
        return service.complete(
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
                detail=(
                    "Campaign not found."
                    if detail == "Business account not found."
                    else detail
                ),
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        ) from exc


@router.post(
    "/{campaign_id}/cancel",
    response_model=CampaignResponse,
)
def cancel_campaign(
    campaign_id: int,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    service: CampaignLifecycleService = Depends(
        get_service
    ),
):
    try:
        return service.cancel(
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
                detail=(
                    "Campaign not found."
                    if detail == "Business account not found."
                    else detail
                ),
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        ) from exc


@router.post(
    "/{campaign_id}/execute",
    response_model=CampaignResponse,
)
def execute_campaign(
    campaign_id: int,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    context: TenantContext = Depends(
        get_current_tenant
    ),
    db: Session = Depends(get_db),
):
    service = CampaignLifecycleService(db)

    campaign = _get_campaign_or_404(
        service,
        context,
        business_account_id,
        campaign_id,
    )

    if campaign.status not in {
        "draft",
        "paused",
    }:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Campaign cannot be executed "
                f"from status '{campaign.status}'."
            ),
        )

    try:
        runner = GraphRunner()

        result = runner.run(
            {
                "tenant_id": context.tenant_id,
                "business_account_id": business_account_id,
                "campaign_id": campaign_id,
                "execution_mode": campaign.execution_mode,
                "user_input": (
                    f"Create the marketing content "
                    f"for campaign "
                    f"'{campaign.campaign_name}'."
                ),
                "brand_name": None,
                "errors": [],
                "warnings": [],
                "status": "running",
            }
        )

        if result.get("status") == "failed":
            raise ValueError(
                "; ".join(
                    result.get(
                        "errors",
                        [
                            "Campaign execution failed."
                        ],
                    )
                )
            )

        bundle = result.get("campaign_bundle")

        if bundle is None:
            raise ValueError(
                "Campaign execution produced "
                "no campaign bundle."
            )

        content = bundle.content
        schedule = result.get("schedule")

        if schedule is None:
            raise ValueError(
                "Campaign execution produced "
                "no publishing schedule."
            )

        CampaignPostService(
            db
        ).create_from_content_and_schedule(
            context,
            business_account_id,
            campaign_id,
            content,
            schedule,
        )

        db.refresh(campaign)

        return campaign

    except ValueError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{campaign_id}/resume",
    response_model=CampaignResponse,
)
def resume_campaign(
    campaign_id: int,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    context: TenantContext = Depends(
        get_current_tenant
    ),
    db: Session = Depends(get_db),
):
    service = CampaignLifecycleService(db)

    try:
        return service.resume(
            context,
            business_account_id,
            campaign_id,
        )

    except ValueError as exc:
        message = str(exc)

        if message in {
            "Campaign not found.",
            "Business account not found.",
        }:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "Campaign not found."
                    if message == "Business account not found."
                    else message
                ),
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=message,
        ) from exc


@router.delete(
    "/{campaign_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_campaign(
    campaign_id: int,
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    service: CampaignLifecycleService = Depends(
        get_service
    ),
):
    try:
        service.delete(
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
                detail=(
                    "Campaign not found."
                    if detail == "Business account not found."
                    else detail
                ),
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        ) from exc