from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies import get_tenant_context
from app.database.session import get_db
from app.schemas.audience import (
    TargetAudienceCreate,
    TargetAudienceResponse,
    TargetAudienceUpdate,
)
from app.security.tenant import TenantContext
from app.services.audience_service import (
    TargetAudienceService,
)


router = APIRouter(
    prefix="/audiences",
    tags=["audiences"],
)


@router.get(
    "",
    response_model=list[TargetAudienceResponse],
)
def list_audiences(
    business_account_id: int = Query(..., gt=0),
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):
    return TargetAudienceService(db).list(
        context,
        business_account_id,
    )


@router.get(
    "/{audience_id}",
    response_model=TargetAudienceResponse,
)
def get_audience(
    audience_id: int,
    business_account_id: int = Query(..., gt=0),
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    audience = TargetAudienceService(db).get(
        context,
        business_account_id,
        audience_id,
    )

    if audience is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target audience not found.",
        )

    return audience


@router.post(
    "",
    response_model=TargetAudienceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_audience(
    data: TargetAudienceCreate,
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):
    return TargetAudienceService(db).create(
        context,
        data,
    )

@router.put(
    "/{audience_id}",
    response_model=TargetAudienceResponse,
)
def update_audience(
    audience_id: int,
    data: TargetAudienceUpdate,
    business_account_id: int = Query(..., gt=0),
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    service = TargetAudienceService(db)

    try:
        return service.update(
            context,
            business_account_id,
            audience_id,
            data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


@router.delete(
    "/{audience_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_audience(
    audience_id: int,
    business_account_id: int = Query(..., gt=0),
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    try:
        TargetAudienceService(db).delete(
            context,
            business_account_id,
            audience_id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )