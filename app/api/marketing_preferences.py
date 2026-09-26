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
from app.schemas.marketing_preferences import (
    MarketingPreferencesCreate,
    MarketingPreferencesResponse,
    MarketingPreferencesUpdate,
)
from app.security.tenant import TenantContext
from app.services.marketing_preferences_service import (
    MarketingPreferencesService,
)


router = APIRouter(
    prefix="/marketing-preferences",
    tags=["marketing-preferences"],
)


@router.get(
    "",
    response_model=MarketingPreferencesResponse | None,
)
def get_preferences(
    business_account_id: int = Query(..., gt=0),
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    return MarketingPreferencesService(db).get(
        context,
        business_account_id,
    )


@router.post(
    "",
    response_model=MarketingPreferencesResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_preferences(
    data: MarketingPreferencesCreate,
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    service = MarketingPreferencesService(db)

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
    response_model=MarketingPreferencesResponse,
)
def update_preferences(
    data: MarketingPreferencesUpdate,
    business_account_id: int = Query(..., gt=0),
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    service = MarketingPreferencesService(db)

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