from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_tenant_context,
)
from app.database.session import get_db
from app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)
from app.security.tenant import TenantContext
from app.services.product_service import (
    ProductService,
)


router = APIRouter(
    prefix="/products",
    tags=["products"],
)


@router.get(
    "",
    response_model=list[ProductResponse],
)
def list_products(
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    return ProductService(db).list(
        context
    )


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
def get_product(
    product_id: int,
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    product = ProductService(db).get(
        context,
        product_id,
    )

    if product is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    return product


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    data: ProductCreate,
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    return ProductService(db).create(
        context,
        data,
    )


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,
    data: ProductUpdate,
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    service = ProductService(db)

    try:

        return service.update(
            context,
            product_id,
            data,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product(
    product_id: int,
    context: TenantContext = Depends(
        get_tenant_context
    ),
    db: Session = Depends(get_db),
):

    try:

        ProductService(db).delete(
            context,
            product_id,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )