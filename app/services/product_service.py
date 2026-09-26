from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import BusinessAccount, Product
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
)
from app.security.tenant import TenantContext


class ProductService:

    def __init__(self, db: Session):
        self.db = db

    # --------------------------------------------------
    # BUSINESS ACCOUNT VALIDATION
    # --------------------------------------------------

    def _validate_business_account(
        self,
        context: TenantContext,
        business_account_id: int,
    ) -> None:

        if business_account_id <= 0:
            raise ValueError(
                "business_account_id must be positive."
            )

        business_account = self.db.scalar(
            select(BusinessAccount).where(
                BusinessAccount.id == business_account_id,
                BusinessAccount.tenant_id
                == context.tenant_id,
            )
        )

        if business_account is None:
            raise ValueError(
                "Business account not found."
            )

        if business_account.status != "active":
            raise ValueError(
                "Business account is not active."
            )

    # --------------------------------------------------
    # LIST
    # --------------------------------------------------

    def list(
        self,
        context: TenantContext,
    ) -> list[Product]:

        return list(
            self.db.scalars(
                select(Product)
                .where(
                    Product.tenant_id
                    == context.tenant_id
                )
                .order_by(Product.id)
            ).all()
        )

    # --------------------------------------------------
    # GET
    # --------------------------------------------------

    def get(
        self,
        context: TenantContext,
        product_id: int,
    ) -> Product | None:

        return self.db.scalar(
            select(Product).where(
                Product.id == product_id,
                Product.tenant_id
                == context.tenant_id,
            )
        )

    # --------------------------------------------------
    # CREATE
    # --------------------------------------------------

    def create(
        self,
        context: TenantContext,
        data: ProductCreate,
    ) -> Product:

        values = data.model_dump()

        business_account_id = values.get(
            "business_account_id"
        )

        self._validate_business_account(
            context,
            business_account_id,
        )

        # Pydantic HttpUrl must be converted to a
        # plain string before persistence.
        if values.get("product_url") is not None:
            values["product_url"] = str(
                values["product_url"]
            )

        product = Product(
            tenant_id=context.tenant_id,
            **values,
        )

        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)

        return product

    # --------------------------------------------------
    # UPDATE
    # --------------------------------------------------

    def update(
        self,
        context: TenantContext,
        product_id: int,
        data: ProductUpdate,
    ) -> Product:

        product = self.get(
            context,
            product_id,
        )

        if product is None:
            raise ValueError(
                "Product not found."
            )

        values = data.model_dump(
            exclude_unset=True
        )

        # A product's business account must never be
        # changed to an account outside this tenant.
        if "business_account_id" in values:

            self._validate_business_account(
                context,
                values["business_account_id"],
            )

        # Pydantic HttpUrl must also be converted
        # when updating an existing product.
        if values.get("product_url") is not None:
            values["product_url"] = str(
                values["product_url"]
            )

        for field, value in values.items():
            setattr(
                product,
                field,
                value,
            )

        self.db.commit()
        self.db.refresh(product)

        return product

    # --------------------------------------------------
    # DELETE
    # --------------------------------------------------

    def delete(
        self,
        context: TenantContext,
        product_id: int,
    ) -> None:

        product = self.get(
            context,
            product_id,
        )

        if product is None:
            raise ValueError(
                "Product not found."
            )

        self.db.delete(product)
        self.db.commit()