from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies import get_tenant_context
from app.database.session import get_db
from app.schemas.brand import (
    BrandProfileCreate,
    BrandProfileResponse,
    BrandProfileUpdate,
)
from app.security.tenant import TenantContext
from app.services.brand_profile_service import (
    BrandProfileService,
)


router = APIRouter(
    prefix="/brand",
    tags=["brand"],
)


@router.get(
    "",
    response_model=BrandProfileResponse | None,
)
def get_brand(
    business_account_id: int,
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):
    return BrandProfileService(db).get(
        context,
        business_account_id,
    )


@router.post(
    "",
    response_model=BrandProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_brand(
    data: BrandProfileCreate,
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):
    service = BrandProfileService(db)

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
    response_model=BrandProfileResponse,
)
def update_brand(
    data: BrandProfileUpdate,
    business_account_id: int,
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):
    service = BrandProfileService(db)

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