from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx

from app.models.config import settings
from app.schemas.credentials import OAuthCredential
from app.security.oauth.base import OAuthProvider


class MetaOAuthProvider(OAuthProvider):

    @property
    def provider_name(self) -> str:
        return "meta"

    @property
    def authorization_base_url(self) -> str:
        return (
            "https://www.facebook.com/"
            f"{settings.META_API_VERSION}"
            "/dialog/oauth"
        )

    @property
    def token_url(self) -> str:
        return (
            "https://graph.facebook.com/"
            f"{settings.META_API_VERSION}"
            "/oauth/access_token"
        )

    @property
    def graph_base_url(self) -> str:
        return (
            "https://graph.facebook.com/"
            f"{settings.META_API_VERSION}"
        )

    def build_authorization_url(
        self,
        state: str,
    ) -> str:

        if not settings.META_APP_ID:
            raise ValueError(
                "META_APP_ID is not configured."
            )

        if not settings.META_CONFIG_ID:
            raise ValueError(
                "META_CONFIG_ID is not configured."
            )

        if not settings.META_REDIRECT_URI:
            raise ValueError(
                "META_REDIRECT_URI is not configured."
            )

        params = {
            "client_id": settings.META_APP_ID,
            "redirect_uri": settings.META_REDIRECT_URI,
            "config_id": settings.META_CONFIG_ID,
            "state": state,
            "response_type": "code",
            "override_default_response_type": "true",
        }

        return (
            f"{self.authorization_base_url}?"
            f"{urlencode(params)}"
        )

    async def exchange_code(
        self,
        code: str,
        redirect_uri: str,
        tenant_id: str,
    ) -> OAuthCredential:

        if not tenant_id:
            raise ValueError(
                "tenant_id is required for Meta OAuth exchange."
            )

        if not settings.META_APP_ID:
            raise ValueError(
                "META_APP_ID is not configured."
            )

        if not settings.META_APP_SECRET:
            raise ValueError(
                "META_APP_SECRET is not configured."
            )

        if not settings.META_REDIRECT_URI:
            raise ValueError(
                "META_REDIRECT_URI is not configured."
            )

        if not redirect_uri:
            raise ValueError(
                "redirect_uri is required for Meta OAuth exchange."
            )

        if redirect_uri != settings.META_REDIRECT_URI:
            raise ValueError(
                "Meta OAuth redirect_uri does not match "
                "META_REDIRECT_URI."
            )

        response = await self._request_token(
            params={
                "client_id": settings.META_APP_ID,
                "client_secret": settings.META_APP_SECRET,
                "redirect_uri": redirect_uri,
                "code": code,
            }
        )

        return await self._build_credential(
            payload=response,
            tenant_id=tenant_id,
        )

    async def refresh(
        self,
        credential: OAuthCredential,
    ) -> OAuthCredential:

        if not credential.tenant_id:
            raise ValueError(
                "tenant_id is required for Meta credential refresh."
            )

        if not settings.META_APP_ID:
            raise ValueError(
                "META_APP_ID is not configured."
            )

        if not settings.META_APP_SECRET:
            raise ValueError(
                "META_APP_SECRET is not configured."
            )

        # IMPORTANT:
        # credential.access_token is the Page access token.
        # Meta's fb_exchange_token flow must use the User access token.
        #
        # We store that User access token in the encrypted
        # credential.refresh_token field.
        if not credential.refresh_token:
            raise ValueError(
                "Meta credential has no User access token "
                "available for refresh."
            )

        response = await self._request_token(
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.META_APP_ID,
                "client_secret": settings.META_APP_SECRET,
                "fb_exchange_token": credential.refresh_token,
            }
        )

        selected_platform = credential.metadata.get(
            "selected_platform"
        )

        selected_external_account_id = credential.metadata.get(
            "selected_external_account_id"
        )

        return await self._build_credential(
            payload=response,
            tenant_id=credential.tenant_id,
            previous=credential,
            selected_platform=selected_platform,
            selected_external_account_id=(
                selected_external_account_id
            ),
        )

    async def _request_token(
        self,
        *,
        params: dict[str, str],
    ) -> dict:

        async with httpx.AsyncClient(
            timeout=30
        ) as client:

            response = await client.get(
                self.token_url,
                params=params,
            )

        try:
            payload = response.json()

        except ValueError as exc:

            raise ValueError(
                "Meta OAuth returned an invalid JSON response."
            ) from exc

        if response.status_code >= 400:

            error = payload.get(
                "error",
                {}
            )

            raise ValueError(
                error.get(
                    "message",
                    "Meta OAuth request failed.",
                )
            )

        if "error" in payload:

            error = payload["error"]

            raise ValueError(
                error.get(
                    "message",
                    "Meta OAuth request failed.",
                )
            )

        return payload

    async def _fetch_meta_pages(
        self,
        access_token: str,
    ) -> list[dict]:
        """
        Fetch all Facebook Pages available to the Meta user.

        Each Page may optionally contain a linked
        Instagram professional account.
        """

        if not access_token:
            raise ValueError(
                "Meta User access token is required "
                "to resolve connected accounts."
            )

        url = (
            f"{self.graph_base_url}/me/accounts"
        )

        params = {
            "fields": (
                "id,name,access_token,"
                "instagram_business_account"
            ),
            "access_token": access_token,
        }

        async with httpx.AsyncClient(
            timeout=30
        ) as client:

            response = await client.get(
                url,
                params=params,
            )

        try:

            payload = response.json()

        except ValueError as exc:

            raise ValueError(
                "Meta account lookup returned invalid JSON."
            ) from exc

        if response.status_code >= 400:

            error = payload.get(
                "error",
                {}
            )

            raise ValueError(
                error.get(
                    "message",
                    "Meta account lookup failed.",
                )
            )

        if "error" in payload:

            error = payload["error"]

            raise ValueError(
                error.get(
                    "message",
                    "Meta account lookup failed.",
                )
            )

        pages = payload.get(
            "data",
            []
        )

        if not pages:

            raise ValueError(
                "No Facebook Pages were found "
                "for the connected Meta account."
            )

        return pages

    async def _get_meta_accounts_for_selection(
        self,
        access_token: str,
    ) -> list[dict]:
        """
        Return all selectable Meta accounts.

        Each Facebook Page is returned as a selectable
        Facebook channel candidate.

        If the Page has a linked Instagram professional
        account, that account is also exposed as an
        Instagram channel candidate.
        """

        pages = await self._fetch_meta_pages(
            access_token
        )

        result = []

        for page in pages:

            page_id = page.get(
                "id"
            )

            page_name = page.get(
                "name"
            )

            page_access_token = page.get(
                "access_token"
            )

            if not page_id:
                continue

            if not page_access_token:
                continue

            result.append(
                {
                    "platform": "facebook",
                    "external_account_id": page_id,
                    "account_name": page_name,
                    "page_id": page_id,
                    "page_name": page_name,
                    "page_access_token": (
                        page_access_token
                    ),
                    "instagram_account_id": None,
                }
            )

            instagram_data = page.get(
                "instagram_business_account"
            )

            instagram_account_id = None

            if instagram_data:

                instagram_account_id = (
                    instagram_data.get("id")
                )

            if instagram_account_id:

                result.append(
                    {
                        "platform": "instagram",
                        "external_account_id": (
                            instagram_account_id
                        ),
                        "account_name": page_name,
                        "page_id": page_id,
                        "page_name": page_name,
                        "page_access_token": (
                            page_access_token
                        ),
                        "instagram_account_id": (
                            instagram_account_id
                        ),
                    }
                )

        if not result:

            raise ValueError(
                "Meta returned no selectable "
                "Facebook or Instagram accounts."
            )

        return result

    async def get_accounts_for_selection(
        self,
        access_token: str,
    ) -> list[dict]:
        """
        Public account-discovery method used by the
        OAuth account-selection flow.

        The returned records contain only account-selection
        information needed by the application. The access
        tokens must never be returned to the frontend.
        """

        accounts = await self._get_meta_accounts_for_selection(
            access_token
        )

        sanitized_accounts = []

        for account in accounts:

            sanitized_accounts.append(
                {
                    "platform": account["platform"],
                    "external_account_id": (
                        account["external_account_id"]
                    ),
                    "account_name": account.get(
                        "account_name"
                    ),
                    "page_id": account.get(
                        "page_id"
                    ),
                    "page_name": account.get(
                        "page_name"
                    ),
                    "instagram_account_id": account.get(
                        "instagram_account_id"
                    ),
                }
            )

        return sanitized_accounts

    async def _select_meta_account(
        self,
        *,
        access_token: str,
        platform: str,
        external_account_id: str,
    ) -> dict:
        """
        Resolve and validate one exact Meta account.

        The account is re-fetched from Meta instead of trusting
        an account ID supplied by the frontend.
        """

        if platform not in {
            "facebook",
            "instagram",
        }:
            raise ValueError(
                "Meta account selection supports only "
                "facebook or instagram."
            )

        if not external_account_id:
            raise ValueError(
                "external_account_id is required "
                "for Meta account selection."
            )

        accounts = await self._get_meta_accounts_for_selection(
            access_token
        )

        for account in accounts:

            if (
                account.get("platform") == platform
                and account.get("external_account_id")
                == external_account_id
            ):
                return account

        raise ValueError(
            "The selected Meta account is not available "
            "to the connected Meta user."
        )

    async def build_credential_for_selected_account(
        self,
        *,
        user_access_token: str,
        tenant_id: str,
        platform: str,
        external_account_id: str,
    ) -> OAuthCredential:
        """
        Build a Meta OAuth credential for the exact account
        selected by the user.

        The supplied Meta User access token is used to
        re-resolve the account from Meta.
        """

        if not user_access_token:
            raise ValueError(
                "Meta User access token is required."
            )

        if not tenant_id:
            raise ValueError(
                "tenant_id is required."
            )

        account = await self._select_meta_account(
            access_token=user_access_token,
            platform=platform,
            external_account_id=external_account_id,
        )

        return await self._build_credential(
            payload={
                "access_token": user_access_token,
            },
            tenant_id=tenant_id,
            selected_platform=platform,
            selected_external_account_id=external_account_id,
            selected_account=account,
        )

    async def _get_meta_accounts(
        self,
        access_token: str,
    ) -> dict:

        pages = await self._fetch_meta_pages(
            access_token
        )

        selected_page = None

        for page in pages:

            if page.get("access_token"):

                selected_page = page
                break

        if selected_page is None:

            raise ValueError(
                "Meta returned Facebook Pages "
                "without Page access tokens."
            )

        instagram_account = (
            selected_page.get(
                "instagram_business_account"
            )
        )

        instagram_account_id = None

        if instagram_account:

            instagram_account_id = (
                instagram_account.get("id")
            )

        return {
            "page_id": selected_page.get(
                "id"
            ),
            "page_name": selected_page.get(
                "name"
            ),
            "page_access_token": (
                selected_page.get(
                    "access_token"
                )
            ),
            "instagram_account_id": (
                instagram_account_id
            ),
        }

    async def _build_credential(
        self,
        *,
        payload: dict,
        tenant_id: str,
        previous: OAuthCredential | None = None,
        selected_platform: str | None = None,
        selected_external_account_id: str | None = None,
        selected_account: dict | None = None,
    ) -> OAuthCredential:

        user_access_token = payload.get(
            "access_token"
        )

        if not user_access_token:
            raise ValueError(
                "Meta OAuth response did not "
                "contain an access token."
            )

        if selected_account is None:

            if (
                selected_platform
                and selected_external_account_id
            ):

                selected_account = (
                    await self._select_meta_account(
                        access_token=user_access_token,
                        platform=selected_platform,
                        external_account_id=(
                            selected_external_account_id
                        ),
                    )
                )

            else:

                account = (
                    await self._get_meta_accounts(
                        user_access_token
                    )
                )

                selected_account = {
                    "platform": (
                        "instagram"
                        if account.get(
                            "instagram_account_id"
                        )
                        else "facebook"
                    ),
                    "external_account_id": (
                        account.get(
                            "instagram_account_id"
                        )
                        or account.get(
                            "page_id"
                        )
                    ),
                    "account_name": account.get(
                        "page_name"
                    ),
                    "page_id": account.get(
                        "page_id"
                    ),
                    "page_name": account.get(
                        "page_name"
                    ),
                    "page_access_token": account.get(
                        "page_access_token"
                    ),
                    "instagram_account_id": account.get(
                        "instagram_account_id"
                    ),
                }

        expires_in = payload.get(
            "expires_in"
        )

        expires_at = None

        if expires_in is not None:

            expires_at = (
                datetime.now(
                    timezone.utc
                )
                + timedelta(
                    seconds=int(expires_in)
                )
            )

        elif previous is not None:

            expires_at = previous.expires_at

        scope = payload.get(
            "scope"
        )

        if scope is None and previous is not None:
            scope = previous.scope

        token_type = payload.get(
            "token_type",
            "Bearer",
        )

        if token_type is None and previous is not None:
            token_type = previous.token_type

        metadata = {}

        if previous is not None:

            metadata.update(
                previous.metadata
            )

        selected_platform = (
            selected_platform
            or selected_account.get(
                "platform"
            )
        )

        selected_external_account_id = (
            selected_external_account_id
            or selected_account.get(
                "external_account_id"
            )
        )

        metadata.update(
            {
                "meta_user_id": payload.get(
                    "user_id"
                ),
                "page_id": selected_account.get(
                    "page_id"
                ),
                "page_name": selected_account.get(
                    "page_name"
                ),
                "facebook_page_id": selected_account.get(
                    "page_id"
                ),
                "facebook_page_access_token": (
                    selected_account.get(
                        "page_access_token"
                    )
                ),
                "instagram_business_account_id": (
                    selected_account.get(
                        "instagram_account_id"
                    )
                ),
                "selected_platform": (
                    selected_platform
                ),
                "selected_external_account_id": (
                    selected_external_account_id
                ),
            }
        )

        page_access_token = selected_account.get(
            "page_access_token"
        )

        if not page_access_token:
            raise ValueError(
                "Meta selected account does not have "
                "a Page access token."
            )

        return OAuthCredential(
            tenant_id=tenant_id,
            platform="meta",

            access_token=page_access_token,

            refresh_token=user_access_token,

            page_access_token=page_access_token,

            expires_at=expires_at,
            token_type=token_type,
            scope=scope,

            platform_account_id=(
                selected_external_account_id
            ),

            metadata=metadata,
        )

    async def _get_instagram_account(
        self,
        access_token: str,
    ) -> dict:
        """
        Resolve the first available Instagram professional
        account through the user's Facebook Pages.

        Kept for backward compatibility with the existing
        Meta OAuth tests and existing credential flow.
        """

        accounts = await self._get_meta_accounts(
            access_token
        )

        instagram_account_id = accounts.get(
            "instagram_account_id"
        )

        if not instagram_account_id:

            raise ValueError(
                "No linked Instagram professional "
                "account was found."
            )

        return accounts