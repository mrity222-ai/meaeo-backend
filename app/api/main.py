import sys
import types
import uuid

if "uuid_utils" not in sys.modules:
    try:
        import uuid_utils
    except Exception:
        class _MockUUIDUtils(types.ModuleType):
            def __init__(self):
                super().__init__("uuid_utils")
                self.UUID = uuid.UUID
                self.uuid1 = uuid.uuid1
                self.uuid3 = uuid.uuid3
                self.uuid4 = uuid.uuid4
                self.uuid5 = uuid.uuid5
                self.uuid6 = uuid.uuid4
                self.uuid7 = uuid.uuid4
                self.uuid8 = uuid.uuid4
                self.NAMESPACE_DNS = uuid.NAMESPACE_DNS
                self.NAMESPACE_URL = uuid.NAMESPACE_URL
                self.NAMESPACE_OID = uuid.NAMESPACE_OID
                self.NAMESPACE_X500 = uuid.NAMESPACE_X500
                self.__version__ = "0.9.0"

            def __getattr__(self, name):
                return getattr(uuid, name, None)

        _mock_mod = _MockUUIDUtils()
        _compat_mod = types.ModuleType("uuid_utils.compat")
        _compat_mod.uuid7 = uuid.uuid4
        _mock_mod.compat = _compat_mod
        sys.modules["uuid_utils"] = _mock_mod
        sys.modules["uuid_utils.compat"] = _compat_mod

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.config import settings

from app.api.auth import router as auth_router

from app.api.oauth import (
    business_account_router as business_account_oauth_router,
    oauth_router,
)

from app.api.campaigns import (
    router as campaigns_router,
)

from app.api.assets import (
    router as assets_router,
)

from app.api.business import (
    router as business_router,
)

from app.api.brand import (
    router as brand_router,
)

from app.api.products import (
    router as products_router,
)

from app.api.audiences import (
    router as audiences_router,
)

from app.api.marketing_preferences import (
    router as marketing_preferences_router,
)

from app.api.campaign_lifecycle import (
    router as campaign_lifecycle_router,
)

from app.api.analytics import (
    router as analytics_router,
)

from app.api.campaign_posts import (
    router as campaign_posts_router,
)

from app.api.business_accounts import (
    router as business_accounts_router,
)

from app.api.admin import (
    router as admin_router,
)

from app.api.payments import (
    router as payments_router,
)

from app.api.support import (
    router as support_router,
)

from app.api.google_business import (
    router as google_business_router,
)

from app.database.base import DatabaseBase
from app.database.session import engine
import app.database.models


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.services.admin_settings_service import settings_scope
    with settings_scope():
        settings.validate_production_config()
    DatabaseBase.metadata.create_all(bind=engine)
    yield



app = FastAPI(
    title="Marketing System API",
    version="1.0.0",
    lifespan=lifespan,
)


allowed_origins = [
    origin.strip()
    for origin in settings.CORS_ALLOWED_ORIGINS.split(",")
    if origin.strip()
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Admin Management
# ---------------------------------------------------------

from app.api.public_marketing import router as public_marketing_router

app.include_router(public_marketing_router)
app.include_router(admin_router)
from app.api.admin_settings import router as admin_settings_router
app.include_router(admin_settings_router)


# ---------------------------------------------------------
# Authentication
# ---------------------------------------------------------

app.include_router(auth_router)


# ---------------------------------------------------------
# OAuth
# ---------------------------------------------------------

app.include_router(
    business_account_oauth_router
)

app.include_router(
    oauth_router
)

app.include_router(
    business_account_oauth_router,
    prefix="/api/v1",
)

app.include_router(
    oauth_router,
    prefix="/api/v1",
)


# ---------------------------------------------------------
# Campaigns
# ---------------------------------------------------------

app.include_router(
    campaigns_router
)


# ---------------------------------------------------------
# Assets
# ---------------------------------------------------------

app.include_router(
    assets_router
)


# ---------------------------------------------------------
# Business Accounts
# ---------------------------------------------------------

app.include_router(
    business_accounts_router
)


# ---------------------------------------------------------
# Business
# ---------------------------------------------------------

app.include_router(
    business_router
)


# ---------------------------------------------------------
# Brand
# ---------------------------------------------------------

app.include_router(
    brand_router
)


# ---------------------------------------------------------
# Products
# ---------------------------------------------------------

app.include_router(
    products_router
)


# ---------------------------------------------------------
# Audiences
# ---------------------------------------------------------

app.include_router(
    audiences_router
)


# ---------------------------------------------------------
# Marketing Preferences
# ---------------------------------------------------------

app.include_router(
    marketing_preferences_router
)


# ---------------------------------------------------------
# Campaign Lifecycle
# ---------------------------------------------------------

app.include_router(
    campaign_lifecycle_router
)


# ---------------------------------------------------------
# Campaign Posts
# ---------------------------------------------------------

app.include_router(
    campaign_posts_router
)


# ---------------------------------------------------------
# Analytics
# ---------------------------------------------------------

app.include_router(
    analytics_router
)


# ---------------------------------------------------------
# Payments & Subscriptions
# ---------------------------------------------------------

app.include_router(
    payments_router
)


# ---------------------------------------------------------
# Customer Support & Tickets
# ---------------------------------------------------------

app.include_router(
    support_router
)


# ---------------------------------------------------------
# Google Business Profile (Reviews, Offers & Local SEO)
# ---------------------------------------------------------

app.include_router(
    google_business_router
)


# ---------------------------------------------------------
# Health
# ---------------------------------------------------------

@app.get("/health")
async def health():
    return {
        "status": "ok"
    }

class RuntimeSettingsMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        from app.services.admin_settings_service import settings_scope
        from fastapi import HTTPException
        from starlette.responses import JSONResponse
        try:
            with settings_scope():
                await self.app(scope, receive, send)
        except HTTPException as exc:
            if exc.status_code != 503:
                raise
            await JSONResponse({"detail": exc.detail}, status_code=503)(scope, receive, send)


app.add_middleware(RuntimeSettingsMiddleware)
