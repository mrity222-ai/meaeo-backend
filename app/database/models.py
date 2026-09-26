# THis is app/database/models.py

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    JSON,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import DatabaseBase
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB

JSON_TYPE = JSON().with_variant(JSONB(), "postgresql")

class Tenant(DatabaseBase):

    __tablename__ = "tenants"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    tenant_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    users: Mapped[list["UserTenant"]] = relationship(
        back_populates="tenant",
        cascade="all, delete-orphan",
    )


class BusinessAccount(DatabaseBase):

    __tablename__ = "business_accounts"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    tenant_id: Mapped[str] = mapped_column(
        ForeignKey(
            "tenants.tenant_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="active",
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    channels: Mapped[list["BusinessChannel"]] = relationship(
        back_populates="business_account",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint(
            "id",
            "tenant_id",
            name="uq_business_account_id_tenant",
        ),
    )


class BusinessChannel(DatabaseBase):

    __tablename__ = "business_channels"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    tenant_id: Mapped[str] = mapped_column(
        ForeignKey(
            "tenants.tenant_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    business_account_id: Mapped[int] = mapped_column(
        nullable=False,
        index=True,
    )

    platform: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )

    external_account_id: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )

    account_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="active",
        index=True,
    )

    is_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    platform_metadata: Mapped[dict | None] = mapped_column(
        JSON_TYPE,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    business_account: Mapped["BusinessAccount"] = relationship(
        back_populates="channels"
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["business_account_id", "tenant_id"],
            [
                "business_accounts.id",
                "business_accounts.tenant_id",
            ],
            name="fk_business_channel_business_account_tenant",
            ondelete="CASCADE",
        ),
        UniqueConstraint(
            "tenant_id",
            "platform",
            "external_account_id",
            name="uq_business_channel_tenant_platform_account",
        ),
        UniqueConstraint(
            "business_account_id",
            "platform",
            name="uq_business_channel_business_platform",
        ),
    )


class User(DatabaseBase):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    google_subject: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    tenants: Mapped[list["UserTenant"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class UserTenant(DatabaseBase):

    __tablename__ = "user_tenants"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    tenant_id: Mapped[int] = mapped_column(
        ForeignKey(
            "tenants.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        back_populates="tenants",
    )

    tenant: Mapped["Tenant"] = relationship(
        back_populates="users",
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "tenant_id",
            name="uq_user_tenant",
        ),
    )


class Asset(DatabaseBase):

    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
    )

    tenant_id: Mapped[str] = mapped_column(
        ForeignKey(
            "tenants.tenant_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    business_account_id: Mapped[int] = mapped_column(
        nullable=False,
        index=True,
    )

    storage_key: Mapped[str] = mapped_column(
        String(1024),
        nullable=False,
        unique=True,
    )

    original_filename: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )

    mime_type: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )

    sha256: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    source: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="available",
        index=True,
    )

    usage_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["business_account_id", "tenant_id"],
            [
                "business_accounts.id",
                "business_accounts.tenant_id",
            ],
            name="fk_assets_business_account_tenant",
            ondelete="CASCADE",
        ),
    )


class AssetUsage(DatabaseBase):

    __tablename__ = "asset_usage"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    asset_id: Mapped[str] = mapped_column(
        ForeignKey(
            "assets.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    tenant_id: Mapped[str] = mapped_column(
        ForeignKey(
            "tenants.tenant_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    campaign_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    day: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    platform: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="reserved",
    )

    external_id: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
    )

    used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "asset_id",
            "campaign_name",
            "day",
            "platform",
            name="uq_asset_campaign_day_platform",
        ),
    )


class BusinessProfile(DatabaseBase):

    __tablename__ = "business_profiles"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    tenant_id: Mapped[str] = mapped_column(
        ForeignKey(
            "tenants.tenant_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    business_account_id: Mapped[int] = mapped_column(
        nullable=False,
        index=True,
    )

    business_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        String(5000),
        nullable=False,
    )

    website: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    country: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )

    city: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["business_account_id", "tenant_id"],
            [
                "business_accounts.id",
                "business_accounts.tenant_id",
            ],
            name="fk_business_profiles_business_account_tenant",
            ondelete="CASCADE",
        ),
    )


class BrandProfile(DatabaseBase):

    __tablename__ = "brand_profiles"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    tenant_id: Mapped[str] = mapped_column(
        ForeignKey(
            "tenants.tenant_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    business_account_id: Mapped[int] = mapped_column(
        nullable=False,
        index=True,
    )

    brand_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    brand_description: Mapped[str | None] = mapped_column(
        String(5000),
        nullable=True,
    )

    industry: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    tone: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    custom_voice: Mapped[str | None] = mapped_column(
        String(5000),
        nullable=True,
    )

    primary_color: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
    )

    secondary_color: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
    )

    logo_asset_id: Mapped[str | None] = mapped_column(
        ForeignKey(
            "assets.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    website: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    whatsapp: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    email: Mapped[str | None] = mapped_column(
        String(320),
        nullable=True,
    )

    address: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    logo_position: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="upper_right",
        server_default="upper_right",
    )

    contact_position: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="lower_right",
        server_default="lower_right",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )



    __table_args__ = (
        ForeignKeyConstraint(
            ["business_account_id", "tenant_id"],
            [
                "business_accounts.id",
                "business_accounts.tenant_id",
            ],
            name="fk_brand_profiles_business_account_tenant",
            ondelete="CASCADE",
        ),
    )


class Product(DatabaseBase):

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    tenant_id: Mapped[str] = mapped_column(
        ForeignKey(
            "tenants.tenant_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    business_account_id: Mapped[int] = mapped_column(
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        String(5000),
        nullable=False,
    )

    type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="product",
    )

    price: Mapped[float | None] = mapped_column(
        nullable=True,
    )

    currency: Mapped[str | None] = mapped_column(
        String(16),
        nullable=True,
    )

    product_url: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    benefits: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    features: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    target_customer: Mapped[str | None] = mapped_column(
        String(5000),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["business_account_id", "tenant_id"],
            [
                "business_accounts.id",
                "business_accounts.tenant_id",
            ],
            name="fk_products_business_account_tenant",
            ondelete="CASCADE",
        ),
    )


class TargetAudience(DatabaseBase):

    __tablename__ = "target_audiences"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    tenant_id: Mapped[str] = mapped_column(
        ForeignKey(
            "tenants.tenant_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    business_account_id: Mapped[int] = mapped_column(
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        String(5000),
        nullable=True,
    )

    age_min: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    age_max: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    genders: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    locations: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    languages: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    interests: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    pain_points: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    needs: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["business_account_id", "tenant_id"],
            [
                "business_accounts.id",
                "business_accounts.tenant_id",
            ],
            name="fk_target_audiences_business_account_tenant",
            ondelete="CASCADE",
        ),
    )


class MarketingPreferences(DatabaseBase):

    __tablename__ = "marketing_preferences"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    tenant_id: Mapped[str] = mapped_column(
        ForeignKey(
            "tenants.tenant_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    business_account_id: Mapped[int] = mapped_column(
        nullable=False,
        index=True,
    )

    primary_goal: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    secondary_goals: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    content_types: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    creativity_level: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    promotional_intensity: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    approval_mode: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="autonomous",
    )

    timezone: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="UTC",
    )

    preferred_posting_time: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default="10:00",
    )

    posting_frequency: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="daily",
    )

    posting_frequency_config: Mapped[dict | None] = mapped_column(
        JSON_TYPE,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["business_account_id", "tenant_id"],
            [
                "business_accounts.id",
                "business_accounts.tenant_id",
            ],
            name="fk_marketing_preferences_business_account_tenant",
            ondelete="CASCADE",
        ),
    )


class Campaign(DatabaseBase):

    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    tenant_id: Mapped[str] = mapped_column(
        ForeignKey(
            "tenants.tenant_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    business_account_id: Mapped[int] = mapped_column(
        nullable=False,
        index=True,
    )

    campaign_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    execution_mode: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="autonomous",
    )

    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="draft",
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    paused_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "campaign_name",
            name="uq_campaign_tenant_name",
        ),
        ForeignKeyConstraint(
            ["business_account_id", "tenant_id"],
            [
                "business_accounts.id",
                "business_accounts.tenant_id",
            ],
            name="fk_campaigns_business_account_tenant",
            ondelete="CASCADE",
        ),
    )


class CampaignPost(DatabaseBase):

    __tablename__ = "campaign_posts"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    campaign_id: Mapped[int] = mapped_column(
        ForeignKey(
            "campaigns.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    tenant_id: Mapped[str] = mapped_column(
        ForeignKey(
            "tenants.tenant_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    day: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    platforms: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
    )

    objective: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
    )

    content_pillar: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
    )

    caption: Mapped[str] = mapped_column(
        String(10000),
        nullable=False,
    )

    hashtags: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    image_prompt: Mapped[str] = mapped_column(
        String(5000),
        nullable=False,
    )

    call_to_action: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
        default="",
    )

    visual_theme: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
        default="",
    )

    asset_tags: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    image_path: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    image_url: Mapped[str | None] = mapped_column(
        String(4096),
        nullable=True,
    )

    review_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="pending",
        index=True,
    )

    rejection_reason: Mapped[str | None] = mapped_column(
        String(5000),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    scheduled_for: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    publish_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="pending",
        index=True,
    )

    publish_attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    max_publish_attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
    )

    next_retry_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    publishing_started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    external_ids: Mapped[dict | None] = mapped_column(
        JSON_TYPE,
        nullable=True,
    )

    publishing_error: Mapped[str | None] = mapped_column(
        String(10000),
        nullable=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "campaign_id",
            "day",
            "title",
            name="uq_campaign_post_day_title",
        ),
    )


class CampaignPostPublication(DatabaseBase):
    __tablename__ = "campaign_post_publications"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    campaign_post_id: Mapped[int] = mapped_column(
        ForeignKey(
            "campaign_posts.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    tenant_id: Mapped[str] = mapped_column(
        ForeignKey(
            "tenants.tenant_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    business_channel_id: Mapped[int] = mapped_column(
        ForeignKey(
            "business_channels.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    platform: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )

    idempotency_key: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="pending",
        index=True,
    )

    attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    external_id: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
    )

    provider_reference: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    last_error: Mapped[str | None] = mapped_column(
        String(10000),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "campaign_post_id",
            "business_channel_id",
            name="uq_campaign_post_publication_post_channel",
        ),
    )

class StorageDocument(DatabaseBase):

    __tablename__ = "storage_documents"

    storage_key: Mapped[str] = mapped_column(
        String(1024),
        primary_key=True,
    )

    data: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import DatabaseBase


class EmailVerification(DatabaseBase):
    __tablename__ = "email_verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    email: Mapped[str] = mapped_column(
        String(320),
        nullable=False,
        index=True,
    )

    code_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    business_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    last_sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    max_attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=5,
    )

    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

class PasswordResetRequest(DatabaseBase):
    __tablename__ = "password_reset_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    email: Mapped[str] = mapped_column(
        String(320),
        nullable=False,
        index=True,
    )

    code_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    reset_token_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    last_sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    max_attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=5,
    )

    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class SubscriptionPlan(DatabaseBase):
    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plan_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    price: Mapped[float] = mapped_column(nullable=False, default=0.0)
    price_usd: Mapped[float | None] = mapped_column(nullable=True, default=0.0)
    currency: Mapped[str] = mapped_column(String(16), nullable=False, default="INR")
    billing_interval: Mapped[str] = mapped_column(String(32), nullable=False, default="monthly")
    max_brands: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    max_campaigns_per_month: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    features: Mapped[dict | None] = mapped_column(JSON_TYPE, nullable=True)
    is_popular: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    badge_text: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class TenantSubscription(DatabaseBase):
    __tablename__ = "tenant_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False)
    provider: Mapped[str] = mapped_column(String(64), nullable=False, default="razorpay")
    provider_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active", index=True)
    current_period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class PaymentTransaction(DatabaseBase):
    __tablename__ = "payment_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    order_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    payment_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount: Mapped[float] = mapped_column(nullable=False)
    currency: Mapped[str] = mapped_column(String(16), nullable=False, default="INR")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="created", index=True)
    provider: Mapped[str] = mapped_column(String(64), nullable=False, default="razorpay")
    raw_response: Mapped[dict | None] = mapped_column(JSON_TYPE, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class SupportTicket(DatabaseBase):
    __tablename__ = "support_tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ticket_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False, default="general")
    priority: Mapped[str] = mapped_column(String(32), nullable=False, default="medium")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class SupportMessage(DatabaseBase):
    __tablename__ = "support_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sender_type: Mapped[str] = mapped_column(String(32), nullable=False, default="user")
    message: Mapped[str] = mapped_column(String(5000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class GoogleBusinessReview(DatabaseBase):
    __tablename__ = "google_business_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False, index=True)
    business_channel_id: Mapped[int | None] = mapped_column(ForeignKey("business_channels.id", ondelete="CASCADE"), nullable=True, index=True)
    account_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    review_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    reviewer_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Customer")
    reviewer_photo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    star_rating: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    comment: Mapped[str | None] = mapped_column(String(4000), nullable=True)
    review_create_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    reply_status: Mapped[str] = mapped_column(String(32), nullable=False, default="unanswered")  # unanswered, generated, replied
    reply_text: Mapped[str | None] = mapped_column(String(4000), nullable=True)
    replied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    sentiment: Mapped[str | None] = mapped_column(String(32), nullable=True)
    seo_keywords_used: Mapped[list | None] = mapped_column(JSON_TYPE, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "location_name", "review_id", name="uq_tenant_location_review"),
    )


class GoogleBusinessPost(DatabaseBase):
    __tablename__ = "google_business_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False, index=True)
    business_channel_id: Mapped[int | None] = mapped_column(ForeignKey("business_channels.id", ondelete="CASCADE"), nullable=True, index=True)
    location_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    post_type: Mapped[str] = mapped_column(String(32), nullable=False, default="OFFER")  # OFFER, STANDARD, EVENT
    summary: Mapped[str] = mapped_column(String(4000), nullable=False)

    offer_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    coupon_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    redeem_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    terms_conditions: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    call_to_action_type: Mapped[str | None] = mapped_column(String(32), nullable=True, default="LEARN_MORE")
    call_to_action_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    media_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")  # draft, published, failed
    google_post_id: Mapped[str | None] = mapped_column(String(512), nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)