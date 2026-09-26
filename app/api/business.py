from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.business import (
    BusinessProfileCreate,
    BusinessProfileResponse,
    BusinessProfileUpdate,
)
from app.security.tenant import TenantContext
from app.api.dependencies import get_tenant_context
from app.services.business_profile_service import (
    BusinessProfileService,
)


router = APIRouter(
    prefix="/business",
    tags=["business"],
)


@router.get(
    "",
    response_model=BusinessProfileResponse | None,
)
def get_business(
    business_account_id: int = Query(..., gt=0),
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    return BusinessProfileService(db).get(
        context,
        business_account_id,
    )


@router.post(
    "",
    response_model=BusinessProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_business(
    data: BusinessProfileCreate,
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):
    service = BusinessProfileService(db)

    try:
        return service.create(
            context,
            data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )

@router.put(
    "",
    response_model=BusinessProfileResponse,
)
def update_business(
    data: BusinessProfileUpdate,
    business_account_id: int = Query(..., gt=0),
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    service = BusinessProfileService(db)

    try:
        return service.update(
            context,
            business_account_id,
            data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )