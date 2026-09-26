from pydantic import BaseModel, Field, HttpUrl


class ProductBase(BaseModel):

    name: str = Field(
        min_length=1,
        max_length=255,
    )

    description: str = Field(
        min_length=1,
        max_length=5000,
    )

    type: str = Field(
        default="product",
        max_length=64,
    )

    price: float | None = Field(
        default=None,
        ge=0,
    )

    currency: str | None = Field(
        default=None,
        max_length=16,
    )

    product_url: HttpUrl | None = None

    benefits: list[str] = Field(
        default_factory=list,
    )

    features: list[str] = Field(
        default_factory=list,
    )

    target_customer: str | None = Field(
        default=None,
        max_length=5000,
    )

    is_active: bool = True


class ProductCreate(ProductBase):

    business_account_id: int


class ProductUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    description: str | None = Field(
        default=None,
        min_length=1,
        max_length=5000,
    )

    type: str | None = Field(
        default=None,
        max_length=64,
    )

    price: float | None = Field(
        default=None,
        ge=0,
    )

    currency: str | None = Field(
        default=None,
        max_length=16,
    )

    product_url: HttpUrl | None = None

    benefits: list[str] | None = None

    features: list[str] | None = None

    target_customer: str | None = Field(
        default=None,
        max_length=5000,
    )

    is_active: bool | None = None


class ProductResponse(ProductBase):

    id: int
    tenant_id: str
    business_account_id: int