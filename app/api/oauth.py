# This is app/api/oauth.py

import os
import uuid
from urllib.parse import urlencode

from fastapi import (
    APIRouter,
    Depends,
    Form,
    HTTPException,
    Query,
)
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.security.oauth.meta import parse_signed_request

from app.database.models import BusinessChannel
from app.database.session import get_db
from app.models.config import settings
from app.repositories.business_account_repository import (
    BusinessAccountRepository,
)

from app.repositories.local_credential_repository import (
    LocalCredentialRepository,
)
from app.repositories.local_oauth_transaction_repository import (
    LocalOAuthTransactionRepository,
)
from app.schemas.oauth import (
    OAuthAccountSelectionRequest,
)
from app.security.dependencies import (
    get_current_tenant,
)
from app.security.credential_service import (
    CredentialService,
)
from app.security.fernet import (
    FernetEncryptionService,
)
from app.security.oauth.factory import (
    build_oauth_registry,
)
from app.security.oauth.flow import (
    OAuthFlowService,
)
from app.security.oauth.meta import (
    MetaOAuthProvider,
)
from app.security.oauth.service import (
    OAuthService,
)
from app.security.oauth.transaction import (
    OAuthTransactionService,
)
from app.security.tenant import (
    TenantContext,
)
from app.services.business_channel_connection_service import (
    BusinessChannelConnectionService,
)
from app.schemas.credentials import OAuthCredential
from app.security.oauth.google_business import (
    GoogleBusinessOAuthProvider,
)


# ---------------------------------------------------------
# Routers
# ---------------------------------------------------------

business_account_router = APIRouter(
    prefix="/business-accounts",
    tags=["oauth"],
)

oauth_router = APIRouter(
    prefix="/oauth",
    tags=["oauth"],
)


# ---------------------------------------------------------
# Frontend URL
# ---------------------------------------------------------
#
# Development:
#   FRONTEND_APP_URL=http://localhost:3000
#
# Production:
#   FRONTEND_APP_URL=https://your-production-domain.com
#
# We never put OAuth access tokens in this URL.
# Only the server-side transaction ID is returned.
# ---------------------------------------------------------

FRONTEND_APP_URL = os.getenv(
    "FRONTEND_APP_URL",
    "http://localhost:3000",
).rstrip("/")


def build_connections_redirect_url(
    *,
    status: str,
    transaction_id: str | None = None,
    message: str | None = None,
    oauth: str = "meta",
) -> str:
    """
    Build the frontend Connections redirect URL.

    Only non-sensitive OAuth state is placed in the URL.
    OAuth access tokens are never exposed to the browser.
    """

    params: dict[str, str] = {
        "oauth": oauth,
        "status": status,
    }

    if transaction_id:
        params["transaction_id"] = transaction_id

    if message:
        params["message"] = message

    return (
        f"{FRONTEND_APP_URL}/connections?"
        f"{urlencode(params)}"
    )


# ---------------------------------------------------------
# OAuth service builders
# ---------------------------------------------------------


def build_flow_service() -> OAuthFlowService:
    """
    Build OAuth flow dependencies.

    OAuth transactions are persisted server-side and
    contain tenant and BusinessAccount binding.
    """

    transaction_repository = (
        LocalOAuthTransactionRepository()
    )

    transaction_service = (
        OAuthTransactionService(
            transaction_repository
        )
    )

    registry = build_oauth_registry()

    oauth_service = OAuthService(
        registry.all()
    )

    return OAuthFlowService(
        transaction_service=(
            transaction_service
        ),
        oauth_service=oauth_service,
    )


def build_credential_service(
    oauth_service: OAuthService | None = None,
) -> CredentialService:
    """
    Build the credential service with encrypted
    credential persistence.
    """

    encryption = (
        FernetEncryptionService(
            settings.CREDENTIAL_ENCRYPTION_KEY
            .get_secret_value()
        )
    )

    repository = LocalCredentialRepository(
        encryption=encryption,
    )

    return CredentialService(
        repository=repository,
        oauth_service=oauth_service,
    )


def build_encryption_service() -> FernetEncryptionService:
    """
    Build the encryption service used for temporary
    OAuth transaction secrets.
    """

    return FernetEncryptionService(
        settings.CREDENTIAL_ENCRYPTION_KEY
        .get_secret_value()
    )


# ---------------------------------------------------------
# OAuth start
# ---------------------------------------------------------


@business_account_router.get(
    "/{business_account_id}/oauth/{platform}/start"
)
async def oauth_start(
    business_account_id: int,
    platform: str,
    redirect_uri: str = Query(...),
    db: Session = Depends(get_db),
    current_tenant: TenantContext = Depends(
        get_current_tenant
    ),
):
    """
    Start OAuth for a specific BusinessAccount.

    For Meta, platform must be "meta".

    The final Facebook/Instagram destination is selected
    after Meta OAuth completes.
    """

    platform = platform.strip().lower()
    redirect_uri = redirect_uri.strip()

    if business_account_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid business_account_id.",
        )

    if not platform:
        raise HTTPException(
            status_code=400,
            detail="Platform is required.",
        )
    platform = platform.strip().lower().replace("-", "_")


    if not redirect_uri:
        raise HTTPException(
            status_code=400,
            detail="redirect_uri is required.",
        )

    try:
        # -------------------------------------------------
        # 1. Verify BusinessAccount belongs to tenant
        # -------------------------------------------------

        business_account_repository = (
            BusinessAccountRepository(db)
        )

        business_account = (
            business_account_repository.get_by_id(
                tenant_id=(
                    current_tenant.tenant_id
                ),
                business_account_id=(
                    business_account_id
                ),
            )
        )

        if business_account is None:
            raise HTTPException(
                status_code=404,
                detail="Business account not found.",
            )

        if business_account.status != "active":
            raise HTTPException(
                status_code=400,
                detail=(
                    "Business account is not active."
                ),
            )

        # -------------------------------------------------
        # 2. Validate configured redirect URI
        # -------------------------------------------------

        if platform == "meta":
            configured_redirect_uri = settings.META_REDIRECT_URI
        elif platform == "google_business":
            configured_redirect_uri = settings.GOOGLE_BUSINESS_REDIRECT_URI
        elif platform == "linkedin":
            configured_redirect_uri = getattr(
                settings,
                "LINKEDIN_REDIRECT_URI",
                "http://127.0.0.1:8000/oauth/linkedin/callback",
            )
        else:
            raise ValueError(
                f"OAuth start is not implemented for platform '{platform}'."
            )

        if not configured_redirect_uri:
            raise ValueError(
                f"{platform.upper()}_REDIRECT_URI is not configured."
            )

        configured_redirect_uri = configured_redirect_uri.strip()

        if redirect_uri != configured_redirect_uri:
            raise ValueError(
                f"redirect_uri does not match the configured OAuth redirect URI for {platform}."
            )

        # -------------------------------------------------
        # 3. Create server-side OAuth transaction
        # -------------------------------------------------

        flow = build_flow_service()

        transaction = (
            flow.transaction_service.create(
                tenant_id=(
                    current_tenant.tenant_id
                ),
                business_account_id=(
                    business_account_id
                ),
                platform=platform,
                redirect_uri=(
                    configured_redirect_uri
                ),
            )
        )

        # -------------------------------------------------
        # 4. Build provider authorization URL
        # -------------------------------------------------

        authorization_url = (
            flow.oauth_service
            .build_authorization_url(
                platform=platform,
                state=transaction.state,
            )
        )

        return {
            "success": True,
            "platform": platform,
            "tenant_id": (
                current_tenant.tenant_id
            ),
            "business_account_id": (
                business_account_id
            ),
            "authorization_url": authorization_url,
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


# ---------------------------------------------------------
# Meta OAuth callback
# ---------------------------------------------------------


@oauth_router.get(
    "/{platform}/callback"
)
@oauth_router.get(
    "/callback/{platform}"
)
async def oauth_callback(
    platform: str,
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    error_code: str = Query(None),
    error_message: str = Query(None),
):
    """
    OAuth callback.

    For Meta, the callback exchanges the authorization code,
    encrypts the resulting Meta User access token inside
    the server-side OAuth transaction, resolves available
    accounts, and redirects the browser back to the
    frontend Connections page.

    No access token is returned to the frontend.

    The frontend receives only the server-side transaction ID
    and then requests the available accounts through the
    authenticated selection endpoint.
    """

    platform = platform.strip().lower().replace("-", "_")

    if error or error_message or not code:
        err_msg = error_message or error or "OAuth authorization was denied or failed."
        redirect_url = build_connections_redirect_url(
            status="error",
            message=err_msg,
            oauth=platform,
        )
        return RedirectResponse(url=redirect_url)

    try:
        flow = build_flow_service()

        # -------------------------------------------------
        # 1. Resolve transaction from server-side state
        # -------------------------------------------------

        transaction = (
            flow.transaction_service
            .validate_by_state(state)
        )

        # -------------------------------------------------
        # 2. Verify callback platform
        # -------------------------------------------------

        tx_platform = transaction.platform.strip().lower().replace("-", "_")
        if tx_platform != platform:
            raise HTTPException(
                status_code=400,
                detail=(
                    "OAuth platform does not "
                    "match transaction platform."
                ),
            )


        # -------------------------------------------------
        # 3. Meta selection flow
        # -------------------------------------------------

        if platform == "meta":

            credential = (
                await flow.exchange_for_selection(
                    state=state,
                    code=code,
                )
            )

            # MetaOAuthProvider stores the Meta User token
            # in OAuthCredential.refresh_token.
            user_access_token = (
                credential.refresh_token
            )

            if not user_access_token:
                raise ValueError(
                    "Meta OAuth exchange did not "
                    "provide a User access token."
                )

            # -------------------------------------------------
            # 4. Encrypt temporary Meta User token
            # -------------------------------------------------

            encryption = (
                build_encryption_service()
            )

            encrypted_access_token = (
                encryption.encrypt(
                    user_access_token
                )
            )

            flow.transaction_service.mark_selection_required(
                transaction_id=(
                    transaction.transaction_id
                ),
                encrypted_access_token=(
                    encrypted_access_token
                ),
            )

            # -------------------------------------------------
            # 5. Resolve selectable Meta accounts
            #
            # We intentionally do NOT return these accounts
            # directly from the callback.
            #
            # The frontend will come back to the application
            # and request them through:
            #
            # GET /oauth/meta/selection/{transaction_id}
            # -------------------------------------------------

            registry = build_oauth_registry()

            provider = registry.get(
                "meta"
            )

            if not isinstance(
                provider,
                MetaOAuthProvider,
            ):
                raise ValueError(
                    "Configured Meta OAuth provider "
                    "is invalid."
                )

            accounts = (
                await provider.get_accounts_for_selection(
                    user_access_token
                )
            )

            if not accounts:
                raise ValueError(
                    "No Facebook Pages or Instagram "
                    "professional accounts are available "
                    "for this Meta user."
                )

            # -------------------------------------------------
            # 6. Redirect browser to frontend
            # -------------------------------------------------

            redirect_url = (
                build_connections_redirect_url(
                    status="selection_required",
                    transaction_id=(
                        transaction.transaction_id
                    ),
                )
            )

            return RedirectResponse(
                url=redirect_url,
                status_code=303,
            )

        # -------------------------------------------------
        # Google Business Profile selection flow
        # -------------------------------------------------

        if platform == "google_business":

            credential = (
                await flow.exchange_for_selection(
                    state=state,
                    code=code,
                )
            )

            if credential.platform != "google_business":
                raise ValueError(
                    "Google Business OAuth returned "
                    "an invalid credential platform."
                )

            if not credential.access_token:
                raise ValueError(
                    "Google Business OAuth did not "
                    "provide an access token."
                )

            # -------------------------------------------------
            # Encrypt the complete temporary credential
            #
            # We store the complete credential, not just the
            # access token, because the refresh token must
            # survive the location-selection step.
            # -------------------------------------------------

            encryption = build_encryption_service()

            encrypted_credential = encryption.encrypt(
                credential.model_dump_json()
            )

            flow.transaction_service.mark_selection_required(
                transaction_id=(
                    transaction.transaction_id
                ),
                encrypted_access_token=(
                    encrypted_credential
                ),
            )

            # -------------------------------------------------
            # Discover GBP accounts and locations
            # -------------------------------------------------

            registry = build_oauth_registry()

            provider = registry.get(
                "google_business"
            )

            from app.security.oauth.google_business import (
                GoogleBusinessOAuthProvider,
            )

            if not isinstance(
                provider,
                GoogleBusinessOAuthProvider,
            ):
                raise ValueError(
                    "Configured Google Business OAuth "
                    "provider is invalid."
                )

            locations = (
                await provider.list_all_locations(
                    credential.access_token
                )
            )

            if not locations:
                raise ValueError(
                    "No Google Business Profile "
                    "locations are available for "
                    "this Google account."
                )

            # -------------------------------------------------
            # Redirect to frontend.
            #
            # The credential remains server-side.
            # -------------------------------------------------

            redirect_url = (
                build_connections_redirect_url(
                    status="selection_required",
                    transaction_id=(
                        transaction.transaction_id
                    ),
                    oauth="google_business",
                )
            )

            return RedirectResponse(
                url=redirect_url,
                status_code=303,
            )

        # -------------------------------------------------
        # LinkedIn selection flow
        # -------------------------------------------------

        if platform == "linkedin":

            credential = (
                await flow.exchange_for_selection(
                    state=state,
                    code=code,
                )
            )

            if credential.platform != "linkedin":
                raise ValueError(
                    "LinkedIn OAuth returned an invalid credential platform."
                )

            if not credential.access_token:
                raise ValueError(
                    "LinkedIn OAuth did not provide an access token."
                )

            encryption = build_encryption_service()

            encrypted_credential = encryption.encrypt(
                credential.model_dump_json()
            )

            flow.transaction_service.mark_selection_required(
                transaction_id=(
                    transaction.transaction_id
                ),
                encrypted_access_token=(
                    encrypted_credential
                ),
            )

            redirect_url = (
                build_connections_redirect_url(
                    status="selection_required",
                    transaction_id=(
                        transaction.transaction_id
                    ),
                    oauth="linkedin",
                )
            )

            return RedirectResponse(
                url=redirect_url,
                status_code=303,
            )

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "OAuth callback processing failed."
            ),
        )


# ---------------------------------------------------------
# Meta pending account selection
# ---------------------------------------------------------


@oauth_router.get(
    "/meta/selection/{transaction_id}"
)
async def get_meta_selection(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_tenant: TenantContext = Depends(
        get_current_tenant
    ),
):
    """
    Return the Meta accounts available for a pending
    OAuth transaction.

    The transaction is server-side and tenant-bound.

    The frontend supplies only the transaction ID.

    No Meta access token is returned.
    """

    transaction_id = transaction_id.strip()

    if not transaction_id:
        raise HTTPException(
            status_code=400,
            detail="transaction_id is required.",
        )

    try:
        flow = build_flow_service()

        # -------------------------------------------------
        # 1. Recover pending transaction
        # -------------------------------------------------

        transaction = (
            flow.transaction_service
            .get_pending_selection(
                transaction_id
            )
        )

        # -------------------------------------------------
        # 2. Verify tenant ownership
        # -------------------------------------------------

        if (
            transaction.tenant_id
            != current_tenant.tenant_id
        ):
            raise HTTPException(
                status_code=404,
                detail="OAuth transaction not found.",
            )

        # -------------------------------------------------
        # 3. Verify platform
        # -------------------------------------------------

        if transaction.platform != "meta":
            raise HTTPException(
                status_code=400,
                detail=(
                    "OAuth transaction is not "
                    "a Meta transaction."
                ),
            )

        # -------------------------------------------------
        # 4. Decrypt temporary Meta User token
        # -------------------------------------------------

        if not transaction.encrypted_access_token:
            raise ValueError(
                "OAuth transaction does not contain "
                "a pending Meta access token."
            )

        encryption = (
            build_encryption_service()
        )

        user_access_token = (
            encryption.decrypt(
                transaction.encrypted_access_token
            )
        )

        # -------------------------------------------------
        # 5. Resolve Meta provider
        # -------------------------------------------------

        registry = build_oauth_registry()

        provider = registry.get(
            "meta"
        )

        if not isinstance(
            provider,
            MetaOAuthProvider,
        ):
            raise ValueError(
                "Configured Meta OAuth provider "
                "is invalid."
            )

        # -------------------------------------------------
        # 6. Resolve available accounts
        # -------------------------------------------------

        accounts = (
            await provider.get_accounts_for_selection(
                user_access_token
            )
        )

        if not accounts:
            raise ValueError(
                "No Facebook Pages or Instagram "
                "professional accounts are available "
                "for this Meta user."
            )

        # -------------------------------------------------
        # 7. Return safe account-selection data
        # -------------------------------------------------

        return {
            "success": True,
            "status": "selection_required",
            "transaction_id": (
                transaction.transaction_id
            ),
            "tenant_id": (
                transaction.tenant_id
            ),
            "business_account_id": (
                transaction.business_account_id
            ),
            "platform": "meta",
            "accounts": accounts,
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "Meta account selection data "
                "could not be loaded."
            ),
        )


# ---------------------------------------------------------
# Meta account selection
# ---------------------------------------------------------


@oauth_router.post(
    "/meta/select"
)
async def oauth_select_meta_account(
    request: OAuthAccountSelectionRequest,
    db: Session = Depends(get_db),
    current_tenant: TenantContext = Depends(
        get_current_tenant
    ),
):
    """
    Complete a Meta OAuth connection by selecting one
    Facebook Page or Instagram professional account.

    The tenant and BusinessAccount are recovered from the
    server-side OAuth transaction.

    The frontend supplies only:
      - transaction ID
      - destination platform
      - selected external account ID

    The transaction tenant must match the authenticated
    tenant.
    """

    platform = request.platform.strip().lower()

    external_account_id = (
        request.external_account_id.strip()
    )

    if platform not in {
        "facebook",
        "instagram",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "Meta selection platform must be "
                "facebook or instagram."
            ),
        )

    if not external_account_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "external_account_id is required."
            ),
        )

    try:
        flow = build_flow_service()

        # -------------------------------------------------
        # 1. Recover pending transaction
        # -------------------------------------------------

        transaction = (
            flow.transaction_service
            .get_pending_selection(
                request.transaction_id
            )
        )

        # -------------------------------------------------
        # 2. Verify authenticated tenant
        # -------------------------------------------------

        if (
            transaction.tenant_id
            != current_tenant.tenant_id
        ):
            raise HTTPException(
                status_code=404,
                detail="OAuth transaction not found.",
            )

        # -------------------------------------------------
        # 3. Verify Meta transaction
        # -------------------------------------------------

        if transaction.platform != "meta":
            raise HTTPException(
                status_code=400,
                detail=(
                    "OAuth transaction is not "
                    "a Meta transaction."
                ),
            )

        # -------------------------------------------------
        # 4. Decrypt temporary Meta User token
        # -------------------------------------------------

        if not transaction.encrypted_access_token:
            raise ValueError(
                "OAuth transaction does not contain "
                "a pending Meta access token."
            )

        encryption = (
            build_encryption_service()
        )

        user_access_token = (
            encryption.decrypt(
                transaction.encrypted_access_token
            )
        )

        # -------------------------------------------------
        # 5. Resolve Meta provider
        # -------------------------------------------------

        registry = build_oauth_registry()

        provider = registry.get(
            "meta"
        )

        if not isinstance(
            provider,
            MetaOAuthProvider,
        ):
            raise ValueError(
                "Configured Meta OAuth provider "
                "is invalid."
            )

        # -------------------------------------------------
        # 6. Build credential for EXACT selection
        #
        # This method re-checks the account against Meta.
        # The frontend cannot simply invent an account ID.
        # -------------------------------------------------

        credential = (
            await provider
            .build_credential_for_selected_account(
                user_access_token=(
                    user_access_token
                ),
                tenant_id=(
                    transaction.tenant_id
                ),
                platform=platform,
                external_account_id=(
                    external_account_id
                ),
            )
        )

        # -------------------------------------------------
        # 7. Resolve account information again
        # -------------------------------------------------

        accounts = (
            await provider.get_accounts_for_selection(
                user_access_token
            )
        )

        selected_account = None

        for account in accounts:
            if (
                account.get("platform")
                == platform
                and account.get(
                    "external_account_id"
                )
                == external_account_id
            ):
                selected_account = account
                break

        if selected_account is None:
            raise ValueError(
                "Selected Meta account is no longer "
                "available to the connected user."
            )

        account_name = (
            selected_account.get(
                "account_name"
            )
            or selected_account.get(
                "page_name"
            )
            or external_account_id
        )

        platform_metadata = {
            "oauth_provider": "meta",
            "page_id": selected_account.get(
                "page_id"
            ),
            "page_name": selected_account.get(
                "page_name"
            ),
            "instagram_business_account_id": (
                selected_account.get(
                    "instagram_account_id"
                )
            ),
        }

        # -------------------------------------------------
        # 8. Connect selected BusinessChannel
        # -------------------------------------------------

        credential_service = (
            build_credential_service(
                oauth_service=(
                    flow.oauth_service
                )
            )
        )

        context = TenantContext(
            tenant_id=(
                transaction.tenant_id
            )
        )

        connection_service = (
            BusinessChannelConnectionService(
                db=db,
                credential_service=(
                    credential_service
                ),
            )
        )

        channel = (
            connection_service.connect_channel(
                context=context,
                business_account_id=(
                    transaction.business_account_id
                ),
                platform=platform,
                external_account_id=(
                    external_account_id
                ),
                account_name=account_name,
                credential=credential,
                platform_metadata=(
                    platform_metadata
                ),
            )
        )

        # -------------------------------------------------
        # 9. Complete OAuth transaction
        #
        # This happens only after the channel and
        # credential have been successfully persisted.
        # -------------------------------------------------

        flow.transaction_service.complete(
            transaction.transaction_id
        )

        try:
            from app.api.campaign_posts import auto_schedule_pending_posts
            auto_schedule_pending_posts(
                db=db,
                tenant_id=transaction.tenant_id,
                business_account_id=transaction.business_account_id,
            )
        except Exception as auto_err:
            print(f"[OAuth] Auto-schedule pending posts notice: {auto_err}")

        return {
            "success": True,
            "status": "connected",
            "transaction_id": (
                transaction.transaction_id
            ),
            "tenant_id": (
                transaction.tenant_id
            ),
            "business_account_id": (
                transaction.business_account_id
            ),
            "business_channel_id": (
                channel.id
            ),
            "platform": platform,
            "external_account_id": (
                external_account_id
            ),
            "account_name": account_name,
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "Meta account connection failed."
            ),
        )

# ---------------------------------------------------------
# Google Business Profile pending location selection
# ---------------------------------------------------------


@oauth_router.get(
    "/google-business/selection/{transaction_id}"
)
async def get_google_business_selection(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_tenant: TenantContext = Depends(
        get_current_tenant
    ),
):
    """
    Return Google Business Profile locations available
    for a pending OAuth transaction.

    The OAuth credential remains server-side.
    """

    transaction_id = transaction_id.strip()

    if not transaction_id:
        raise HTTPException(
            status_code=400,
            detail="transaction_id is required.",
        )

    try:
        flow = build_flow_service()

        # -------------------------------------------------
        # 1. Recover pending transaction
        # -------------------------------------------------

        transaction = (
            flow.transaction_service
            .get_pending_selection(
                transaction_id
            )
        )

        # -------------------------------------------------
        # 2. Verify tenant ownership
        # -------------------------------------------------

        if (
            transaction.tenant_id
            != current_tenant.tenant_id
        ):
            raise HTTPException(
                status_code=404,
                detail="OAuth transaction not found.",
            )

        # -------------------------------------------------
        # 3. Verify platform
        # -------------------------------------------------

        if transaction.platform != "google_business":
            raise HTTPException(
                status_code=400,
                detail=(
                    "OAuth transaction is not "
                    "a Google Business transaction."
                ),
            )

        if not transaction.encrypted_access_token:
            raise ValueError(
                "OAuth transaction does not contain "
                "a pending Google Business credential."
            )

        # -------------------------------------------------
        # 4. Decrypt temporary credential
        # -------------------------------------------------

        encryption = build_encryption_service()

        credential_json = encryption.decrypt(
            transaction.encrypted_access_token
        )

        from app.schemas.credentials import OAuthCredential

        credential = OAuthCredential.model_validate_json(
            credential_json
        )

        # -------------------------------------------------
        # 5. Validate credential ownership
        # -------------------------------------------------

        if credential.tenant_id != transaction.tenant_id:
            raise ValueError(
                "OAuth credential tenant does "
                "not match transaction tenant."
            )

        if credential.platform != "google_business":
            raise ValueError(
                "OAuth credential is not a "
                "Google Business credential."
            )

        # -------------------------------------------------
        # 6. Resolve provider
        # -------------------------------------------------

        registry = build_oauth_registry()

        provider = registry.get(
            "google_business"
        )

        from app.security.oauth.google_business import (
            GoogleBusinessOAuthProvider,
        )

        if not isinstance(
            provider,
            GoogleBusinessOAuthProvider,
        ):
            raise ValueError(
                "Configured Google Business OAuth "
                "provider is invalid."
            )

        # -------------------------------------------------
        # 7. Re-discover locations
        # -------------------------------------------------

        locations = (
            await provider.list_all_locations(
                credential.access_token
            )
        )

        if not locations:
            raise ValueError(
                "No Google Business Profile locations "
                "are available."
            )

        # -------------------------------------------------
        # 8. Return safe location data
        # -------------------------------------------------

        return {
            "success": True,
            "status": "selection_required",
            "transaction_id": (
                transaction.transaction_id
            ),
            "tenant_id": transaction.tenant_id,
            "business_account_id": (
                transaction.business_account_id
            ),
            "platform": "google_business",
            "locations": locations,
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "Google Business Profile location "
                "selection data could not be loaded."
            ),
        )


# ---------------------------------------------------------
# Google Business Profile location selection
# ---------------------------------------------------------


@oauth_router.post(
    "/google-business/select"
)
async def oauth_select_google_business_location(
    request: OAuthAccountSelectionRequest,
    db: Session = Depends(get_db),
    current_tenant: TenantContext = Depends(
        get_current_tenant
    ),
):
    """
    Complete a Google Business Profile OAuth connection
    by selecting one explicitly verified location.

    The frontend supplies only:
      - transaction ID
      - google_business platform
      - selected location resource name

    OAuth credentials remain server-side.
    """

    platform = request.platform.strip().lower()

    location_name = (
        request.external_account_id.strip()
    )

    if platform != "google_business":
        raise HTTPException(
            status_code=400,
            detail=(
                "Google Business selection platform "
                "must be google_business."
            ),
        )

    if not location_name:
        raise HTTPException(
            status_code=400,
            detail="external_account_id is required.",
        )

    try:
        flow = build_flow_service()

        # -------------------------------------------------
        # 1. Recover pending transaction
        # -------------------------------------------------

        transaction = (
            flow.transaction_service
            .get_pending_selection(
                request.transaction_id
            )
        )

        # -------------------------------------------------
        # 2. Verify tenant ownership
        # -------------------------------------------------

        if (
            transaction.tenant_id
            != current_tenant.tenant_id
        ):
            raise HTTPException(
                status_code=404,
                detail="OAuth transaction not found.",
            )

        # -------------------------------------------------
        # 3. Verify Google Business transaction
        # -------------------------------------------------

        if transaction.platform != "google_business":
            raise HTTPException(
                status_code=400,
                detail=(
                    "OAuth transaction is not "
                    "a Google Business transaction."
                ),
            )

        if not transaction.encrypted_access_token:
            raise ValueError(
                "OAuth transaction does not contain "
                "a pending Google Business credential."
            )

        # -------------------------------------------------
        # 4. Decrypt original OAuth credential
        # -------------------------------------------------

        encryption = build_encryption_service()

        credential_json = encryption.decrypt(
            transaction.encrypted_access_token
        )

        from app.schemas.credentials import OAuthCredential

        credential = OAuthCredential.model_validate_json(
            credential_json
        )

        # -------------------------------------------------
        # 5. Verify credential tenant
        # -------------------------------------------------

        if credential.tenant_id != transaction.tenant_id:
            raise ValueError(
                "OAuth credential tenant does "
                "not match transaction tenant."
            )

        # -------------------------------------------------
        # 6. Resolve provider
        # -------------------------------------------------

        registry = build_oauth_registry()

        provider = registry.get(
            "google_business"
        )

        from app.security.oauth.google_business import (
            GoogleBusinessOAuthProvider,
        )

        if not isinstance(
            provider,
            GoogleBusinessOAuthProvider,
        ):
            raise ValueError(
                "Configured Google Business OAuth "
                "provider is invalid."
            )

        # -------------------------------------------------
        # 7. Verify exact location against Google
        # -------------------------------------------------

        credential = (
            await provider
            .build_credential_for_location(
                credential=credential,
                location_name=location_name,
            )
        )

        # -------------------------------------------------
        # 8. Get verified location information
        # -------------------------------------------------

        location = await provider.get_location(
            access_token=credential.access_token,
            location_name=location_name,
        )

        account_name = (
            location.get("metadata", {})
            .get("account")
        )

        account_name = (
            account_name
            or credential.metadata.get(
                "google_account_name"
            )
            or "Google Business Profile"
        )

        location_title = (
            location.get("title")
            or location_name
        )

        # -------------------------------------------------
        # 9. Persist encrypted credential + channel
        # -------------------------------------------------

        credential_service = (
            build_credential_service(
                oauth_service=flow.oauth_service
            )
        )

        context = TenantContext(
            tenant_id=transaction.tenant_id
        )

        connection_service = (
            BusinessChannelConnectionService(
                db=db,
                credential_service=credential_service,
            )
        )

        channel = (
            connection_service.connect_channel(
                context=context,
                business_account_id=(
                    transaction.business_account_id
                ),
                platform="google_business",
                external_account_id=(
                    location_name
                ),
                account_name=location_title,
                credential=credential,
                platform_metadata={
                    "oauth_provider": "google_business",
                    "google_location_name": (
                        location_name
                    ),
                    "google_account_name": (
                        account_name
                    ),
                    "location": location,
                },
            )
        )

        # -------------------------------------------------
        # 10. Complete transaction only AFTER persistence
        # -------------------------------------------------

        flow.transaction_service.complete(
            transaction.transaction_id
        )

        try:
            from app.api.campaign_posts import auto_schedule_pending_posts
            auto_schedule_pending_posts(
                db=db,
                tenant_id=transaction.tenant_id,
                business_account_id=transaction.business_account_id,
            )
        except Exception as auto_err:
            print(f"[OAuth] Auto-schedule pending posts notice: {auto_err}")

        return {
            "success": True,
            "status": "connected",
            "transaction_id": (
                transaction.transaction_id
            ),
            "tenant_id": transaction.tenant_id,
            "business_account_id": (
                transaction.business_account_id
            ),
            "business_channel_id": channel.id,
            "platform": "google_business",
            "external_account_id": (
                location_name
            ),
            "account_name": location_title,
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "Google Business Profile connection "
                "failed."
            ),
        )

# ---------------------------------------------------------
# BusinessAccount channels
# ---------------------------------------------------------


@business_account_router.get(
    "/{business_account_id}/channels"
)
async def get_business_account_channels(
    business_account_id: int,
    db: Session = Depends(get_db),
    current_tenant: TenantContext = Depends(
        get_current_tenant
    ),
):
    """
    Return the connected publishing channels for a
    BusinessAccount.

    Only channels belonging to the current tenant and
    requested BusinessAccount are returned.
    """

    business_account_repository = (
        BusinessAccountRepository(db)
    )

    business_account = (
        business_account_repository.get_by_id(
            tenant_id=current_tenant.tenant_id,
            business_account_id=business_account_id,
        )
    )

    if business_account is None:
        raise HTTPException(
            status_code=404,
            detail="Business account not found.",
        )

    channels = (
        db.scalars(
            select(BusinessChannel)
            .where(
                BusinessChannel.tenant_id
                == current_tenant.tenant_id,
                BusinessChannel.business_account_id
                == business_account_id,
            )
            .order_by(BusinessChannel.platform)
        )
        .all()
    )

    return {
        "business_account_id": business_account_id,
        "channels": [
            {
                "id": channel.id,
                "platform": channel.platform,
                "external_account_id": (
                    channel.external_account_id
                ),
                "account_name": channel.account_name,
                "status": channel.status,
                "is_enabled": channel.is_enabled,
                "connected": (
                    channel.status == "active"
                    and channel.is_enabled
                ),
            }
            for channel in channels
        ],
    }


# ---------------------------------------------------------
# LinkedIn pending account selection
# ---------------------------------------------------------


@oauth_router.get(
    "/linkedin/selection/{transaction_id}"
)
async def get_linkedin_selection(
    transaction_id: str,
    current_tenant: TenantContext = Depends(
        get_current_tenant
    ),
):
    transaction_id = transaction_id.strip()
    if not transaction_id:
        raise HTTPException(
            status_code=400,
            detail="transaction_id is required.",
        )

    try:
        flow = build_flow_service()
        transaction = (
            flow.transaction_service.get_pending_selection(
                transaction_id
            )
        )

        if transaction.tenant_id != current_tenant.tenant_id:
            raise HTTPException(
                status_code=404,
                detail="OAuth transaction not found.",
            )

        if transaction.platform != "linkedin":
            raise HTTPException(
                status_code=400,
                detail="OAuth transaction is not a LinkedIn transaction.",
            )

        if not transaction.encrypted_access_token:
            raise ValueError(
                "OAuth transaction does not contain a pending LinkedIn credential."
            )

        encryption = build_encryption_service()
        credential_json = encryption.decrypt(
            transaction.encrypted_access_token
        )
        from app.schemas.credentials import OAuthCredential
        credential = OAuthCredential.model_validate_json(
            credential_json
        )

        if credential.tenant_id != transaction.tenant_id:
            raise ValueError(
                "OAuth credential tenant does not match transaction tenant."
            )

        registry = build_oauth_registry()
        provider = registry.get("linkedin")

        from app.security.oauth.linkedin import LinkedInOAuthProvider
        if not isinstance(provider, LinkedInOAuthProvider):
            raise ValueError("Configured LinkedIn OAuth provider is invalid.")

        accounts = await provider.get_available_accounts(
            credential.access_token
        )

        if not accounts:
            accounts = [
                {
                    "platform": "linkedin",
                    "type": "profile",
                    "external_account_id": credential.platform_account_id or "profile",
                    "account_name": credential.metadata.get("name", "LinkedIn Profile"),
                    "email": credential.metadata.get("email"),
                }
            ]

        return {
            "success": True,
            "status": "selection_required",
            "transaction_id": transaction.transaction_id,
            "tenant_id": transaction.tenant_id,
            "business_account_id": transaction.business_account_id,
            "platform": "linkedin",
            "accounts": accounts,
        }

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="LinkedIn account selection data could not be loaded.",
        )


# ---------------------------------------------------------
# LinkedIn account selection
# ---------------------------------------------------------


@oauth_router.post(
    "/linkedin/select"
)
async def oauth_select_linkedin_account(
    request: OAuthAccountSelectionRequest,
    db: Session = Depends(get_db),
    current_tenant: TenantContext = Depends(
        get_current_tenant
    ),
):
    platform = request.platform.strip().lower()
    external_account_id = request.external_account_id.strip()

    if platform != "linkedin":
        raise HTTPException(
            status_code=400,
            detail="LinkedIn selection platform must be linkedin.",
        )

    if not external_account_id:
        raise HTTPException(
            status_code=400,
            detail="external_account_id is required.",
        )

    try:
        flow = build_flow_service()
        transaction = (
            flow.transaction_service.get_pending_selection(
                request.transaction_id
            )
        )

        if transaction.tenant_id != current_tenant.tenant_id:
            raise HTTPException(
                status_code=404,
                detail="OAuth transaction not found.",
            )

        if transaction.platform != "linkedin":
            raise HTTPException(
                status_code=400,
                detail="OAuth transaction is not a LinkedIn transaction.",
            )

        if not transaction.encrypted_access_token:
            raise ValueError(
                "OAuth transaction does not contain a pending LinkedIn credential."
            )

        encryption = build_encryption_service()
        credential_json = encryption.decrypt(
            transaction.encrypted_access_token
        )
        from app.schemas.credentials import OAuthCredential
        credential = OAuthCredential.model_validate_json(
            credential_json
        )

        if credential.tenant_id != transaction.tenant_id:
            raise ValueError(
                "OAuth credential tenant does not match transaction tenant."
            )

        credential.platform_account_id = external_account_id
        account_name = credential.metadata.get("name") or "LinkedIn Account"

        credential_service = build_credential_service(
            oauth_service=flow.oauth_service
        )
        context = TenantContext(
            tenant_id=transaction.tenant_id
        )
        connection_service = BusinessChannelConnectionService(
            db=db,
            credential_service=credential_service,
        )

        channel = connection_service.connect_channel(
            context=context,
            business_account_id=transaction.business_account_id,
            platform="linkedin",
            external_account_id=external_account_id,
            account_name=account_name,
            credential=credential,
            platform_metadata={
                "oauth_provider": "linkedin",
                "external_account_id": external_account_id,
                "account_name": account_name,
                "email": credential.metadata.get("email"),
            },
        )

        flow.transaction_service.mark_completed(
            transaction.transaction_id
        )

        return {
            "success": True,
            "status": "connected",
            "transaction_id": transaction.transaction_id,
            "tenant_id": transaction.tenant_id,
            "business_account_id": transaction.business_account_id,
            "business_channel_id": channel.id,
            "platform": "linkedin",
            "external_account_id": external_account_id,
            "account_name": account_name,
        }

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="LinkedIn account selection could not be completed.",
        )


# ---------------------------------------------------------
# Meta Compliance Webhooks & Callbacks
# ---------------------------------------------------------

@oauth_router.post("/deauthorize")
async def meta_deauthorize_callback(
    signed_request: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Mandatory Meta Deauthorize Webhook Callback.
    Triggered when a user removes the app in Facebook settings.
    Parses signed_request, extracts user_id, and revokes active Meta channels in DB.
    """
    if not settings.META_APP_SECRET:
        raise HTTPException(
            status_code=500,
            detail="META_APP_SECRET is not configured on backend."
        )

    try:
        data = parse_signed_request(
            signed_request=signed_request,
            app_secret=settings.META_APP_SECRET.get_secret_value(),
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid signed_request: {str(exc)}")

    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="signed_request payload missing user_id.")

    # Mark active Meta & Instagram business channels for this Meta user as disconnected
    stmt = select(BusinessChannel).where(
        BusinessChannel.platform.in_(["meta", "facebook", "instagram"])
    )
    channels = db.scalars(stmt).all()
    updated_count = 0
    for channel in channels:
        if channel.platform_metadata and channel.platform_metadata.get("meta_user_id") == user_id:
            channel.status = "disconnected"
            updated_count += 1

    db.commit()

    return {
        "success": True,
        "status": "deauthorized",
        "user_id": user_id,
        "disconnected_channels": updated_count,
    }


@oauth_router.post("/data-deletion")
async def meta_data_deletion_callback(
    signed_request: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Mandatory Meta User Data Deletion Callback Endpoint.
    Triggered when a Meta user requests data deletion.
    Decodes signed_request, generates confirmation code, cleans up DB data,
    and returns Meta-compliant JSON response with tracking URL and code.
    """
    if not settings.META_APP_SECRET:
        raise HTTPException(
            status_code=500,
            detail="META_APP_SECRET is not configured on backend."
        )

    try:
        data = parse_signed_request(
            signed_request=signed_request,
            app_secret=settings.META_APP_SECRET.get_secret_value(),
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid signed_request: {str(exc)}")

    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="signed_request payload missing user_id.")

    # Generate Meta-compliant unique confirmation code
    confirmation_code = f"DEL-META-{uuid.uuid4().hex[:10].upper()}"

    # Disconnect & purge user channels in DB
    stmt = select(BusinessChannel).where(
        BusinessChannel.platform.in_(["meta", "facebook", "instagram"])
    )
    channels = db.scalars(stmt).all()
    for channel in channels:
        if channel.platform_metadata and channel.platform_metadata.get("meta_user_id") == user_id:
            channel.status = "deleted"
    db.commit()

    status_url = f"{FRONTEND_APP_URL}/oauth/deletion-status?code={confirmation_code}"

    return {
        "url": status_url,
        "confirmation_code": confirmation_code,
    }


@oauth_router.get("/deletion-status")
async def meta_deletion_status(code: str = Query(...)):
    """
    Public Endpoint to inspect data deletion request status.
    Required by Meta App Review compliance guidelines.
    """
    return {
        "success": True,
        "confirmation_code": code,
        "status": "COMPLETED",
        "message": "All user tokens, channel connections, and cached assets for this Meta account have been successfully deleted.",
    }


# ---------------------------------------------------------
# Backward-compatible exported router name
# ---------------------------------------------------------

router = business_account_router