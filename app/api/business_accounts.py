from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies import get_tenant_context
from app.database.session import get_db
from app.repositories.business_account_repository import (
    BusinessAccountRepository,
)
from app.schemas.business_account import (
    BusinessAccountCreate,
    BusinessAccountResponse,
)
from app.security.tenant import TenantContext


router = APIRouter(
    prefix="/business-accounts",
    tags=["business-accounts"],
)


@router.post(
    "",
    response_model=BusinessAccountResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_business_account(
    data: BusinessAccountCreate,
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    name = data.name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Business Account name cannot be empty.",
        )

    repository = BusinessAccountRepository(db)

    return repository.create(
        tenant_id=context.tenant_id,
        name=name,
    )


@router.get(
    "",
    response_model=list[BusinessAccountResponse],
)
def list_business_accounts(
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    repository = BusinessAccountRepository(db)

    return repository.list_for_tenant(
        tenant_id=context.tenant_id,
    )


@router.get(
    "/{business_account_id}",
    response_model=BusinessAccountResponse,
)
def get_business_account(
    business_account_id: int,
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    if business_account_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Business Account ID must be greater than zero.",
        )

    repository = BusinessAccountRepository(db)

    business_account = repository.get_by_id(
        tenant_id=context.tenant_id,
        business_account_id=business_account_id,
    )

    if business_account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business Account not found.",
        )

    return business_account