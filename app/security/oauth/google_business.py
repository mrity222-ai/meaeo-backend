from __future__ import annotations

from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx

from app.models.config import settings
from app.schemas.credentials import OAuthCredential
from app.security.oauth.base import OAuthProvider


class GoogleBusinessOAuthProvider(OAuthProvider):
    """
    OAuth provider for Google Business Profile.

    This provider is intentionally separate from the Google authentication
    flow used for SaaS login.

    Google Business Profile OAuth grants access to Business Profile
    accounts and locations owned/managed by the Google user.
    """

    BUSINESS_MANAGE_SCOPE = (
        "https://www.googleapis.com/auth/business.manage"
    )

    ACCOUNT_MANAGEMENT_BASE_URL = (
        "https://mybusinessaccountmanagement.googleapis.com/v1"
    )

    BUSINESS_INFORMATION_BASE_URL = (
        "https://mybusinessbusinessinformation.googleapis.com/v1"
    )

    GOOGLE_OAUTH_AUTHORIZATION_URL = (
        "https://accounts.google.com/o/oauth2/v2/auth"
    )

    GOOGLE_OAUTH_TOKEN_URL = (
        "https://oauth2.googleapis.com/token"
    )

    @property
    def provider_name(self) -> str:
        return "google_business"

    @property
    def authorization_base_url(self) -> str:
        return self.GOOGLE_OAUTH_AUTHORIZATION_URL

    @property
    def token_url(self) -> str:
        return self.GOOGLE_OAUTH_TOKEN_URL

    def _client_id(self) -> str:
        client_id = getattr(
            settings,
            "GOOGLE_CLIENT_ID",
            None,
        )

        if not client_id:
            raise ValueError(
                "GOOGLE_CLIENT_ID is not configured."
            )

        return client_id

    def _client_secret(self) -> str:
        client_secret = getattr(
            settings,
            "GOOGLE_CLIENT_SECRET",
            None,
        )

        if not client_secret:
            raise ValueError(
                "GOOGLE_CLIENT_SECRET is not configured."
            )

        return client_secret.get_secret_value()

    def _redirect_uri(self) -> str:
        redirect_uri = getattr(
            settings,
            "GOOGLE_BUSINESS_REDIRECT_URI",
            None,
        )

        if not redirect_uri:
            raise ValueError(
                "GOOGLE_BUSINESS_REDIRECT_URI is not configured."
            )

        return redirect_uri

    def build_authorization_url(
        self,
        state: str,
    ) -> str:

        if not state:
            raise ValueError(
                "OAuth state is required."
            )

        params = {
            "client_id": self._client_id(),
            "redirect_uri": self._redirect_uri(),
            "response_type": "code",
            "scope": self.BUSINESS_MANAGE_SCOPE,
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
            "include_granted_scopes": "true",
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

        if not code:
            raise ValueError(
                "Google Business OAuth code is required."
            )

        if not tenant_id:
            raise ValueError(
                "tenant_id is required for Google Business OAuth."
            )

        configured_redirect_uri = self._redirect_uri()

        if not redirect_uri:
            raise ValueError(
                "redirect_uri is required for Google Business OAuth."
            )

        if redirect_uri != configured_redirect_uri:
            raise ValueError(
                "Google Business OAuth redirect_uri does not match "
                "GOOGLE_BUSINESS_REDIRECT_URI."
            )

        response = await self._request_token(
            data={
                "client_id": self._client_id(),
                "client_secret": self._client_secret(),
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            }
        )

        return self._build_credential(
            payload=response,
            tenant_id=tenant_id,
        )

    async def refresh(
        self,
        credential: OAuthCredential,
    ) -> OAuthCredential:

        if not credential.tenant_id:
            raise ValueError(
                "tenant_id is required for Google Business "
                "credential refresh."
            )

        if not credential.refresh_token:
            raise ValueError(
                "Google Business credential has no refresh token."
            )

        response = await self._request_token(
            data={
                "client_id": self._client_id(),
                "client_secret": self._client_secret(),
                "refresh_token": credential.refresh_token,
                "grant_type": "refresh_token",
            }
        )

        access_token = response.get("access_token")

        if not access_token:
            raise ValueError(
                "Google token refresh response did not contain "
                "an access token."
            )

        expires_in = response.get("expires_in")

        expires_at = credential.expires_at

        if expires_in is not None:
            expires_at = (
                datetime.now(timezone.utc)
                + timedelta(
                    seconds=int(expires_in)
                )
            )

        scope = response.get(
            "scope",
            credential.scope,
        )

        token_type = response.get(
            "token_type",
            credential.token_type,
        )

        return credential.model_copy(
            update={
                "access_token": access_token,
                "expires_at": expires_at,
                "scope": scope,
                "token_type": token_type,
            }
        )

    async def _request_token(
        self,
        *,
        data: dict[str, str],
    ) -> dict:

        async with httpx.AsyncClient(
            timeout=30
        ) as client:

            response = await client.post(
                self.token_url,
                data=data,
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise ValueError(
                "Google OAuth returned an invalid JSON response."
            ) from exc

        if response.status_code >= 400:
            error_description = payload.get(
                "error_description"
            )

            error = payload.get(
                "error"
            )

            raise ValueError(
                error_description
                or error
                or "Google OAuth token request failed."
            )

        if "error" in payload:
            raise ValueError(
                payload.get(
                    "error_description"
                )
                or payload.get(
                    "error"
                )
                or "Google OAuth token request failed."
            )

        return payload

    def _build_credential(
        self,
        *,
        payload: dict,
        tenant_id: str,
    ) -> OAuthCredential:

        access_token = payload.get(
            "access_token"
        )

        if not access_token:
            raise ValueError(
                "Google Business OAuth response did not "
                "contain an access token."
            )

        refresh_token = payload.get(
            "refresh_token"
        )

        expires_in = payload.get(
            "expires_in"
        )

        expires_at = None

        if expires_in is not None:
            expires_at = (
                datetime.now(timezone.utc)
                + timedelta(
                    seconds=int(expires_in)
                )
            )

        return OAuthCredential(
            tenant_id=tenant_id,
            platform="google_business",
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            token_type=payload.get(
                "token_type",
                "Bearer",
            ),
            scope=payload.get(
                "scope",
                self.BUSINESS_MANAGE_SCOPE,
            ),
            metadata={
                "oauth_provider": "google_business",
            },
        )

    async def list_accounts(
        self,
        access_token: str,
    ) -> list[dict]:

        if not access_token:
            raise ValueError(
                "Google Business access token is required."
            )

        payload = await self._google_get(
            url=(
                f"{self.ACCOUNT_MANAGEMENT_BASE_URL}"
                "/accounts"
            ),
            access_token=access_token,
        )

        accounts = payload.get(
            "accounts",
            []
        )

        result: list[dict] = []

        for account in accounts:
            name = account.get(
                "name"
            )

            if not name:
                continue

            result.append(
                {
                    "name": name,
                    "account_name": account.get(
                        "accountName"
                    ),
                    "type": account.get(
                        "type"
                    ),
                    "role": account.get(
                        "role"
                    ),
                    "state": account.get(
                        "state"
                    ),
                }
            )

        return result

    async def list_locations(
        self,
        *,
        access_token: str,
        account_name: str,
    ) -> list[dict]:

        if not access_token:
            raise ValueError(
                "Google Business access token is required."
            )

        if not account_name:
            raise ValueError(
                "Google Business account name is required."
            )

        if not account_name.startswith(
            "accounts/"
        ):
            raise ValueError(
                "Invalid Google Business account resource name."
            )

        url = (
            f"{self.BUSINESS_INFORMATION_BASE_URL}"
            f"/{account_name}/locations"
        )

        params = {
            "readMask": (
                "name,"
                "title,"
                "storefrontAddress,"
                "websiteUri,"
                "phoneNumbers,"
                "categories,"
                "metadata"
            )
        }

        payload = await self._google_get(
            url=url,
            access_token=access_token,
            params=params,
        )

        locations = payload.get(
            "locations",
            []
        )

        result: list[dict] = []

        for location in locations:
            name = location.get(
                "name"
            )

            if not name:
                continue

            result.append(
                {
                    "name": name,
                    "title": location.get(
                        "title"
                    ),
                    "storefront_address": location.get(
                        "storefrontAddress"
                    ),
                    "website_uri": location.get(
                        "websiteUri"
                    ),
                    "phone_numbers": location.get(
                        "phoneNumbers"
                    ),
                    "categories": location.get(
                        "categories"
                    ),
                    "metadata": location.get(
                        "metadata"
                    ),
                    "account_name": account_name,
                }
            )

        return result

    async def list_all_locations(
        self,
        access_token: str,
    ) -> list[dict]:

        accounts = await self.list_accounts(
            access_token
        )

        locations: list[dict] = []

        for account in accounts:
            account_name = account.get(
                "name"
            )

            if not account_name:
                continue

            account_locations = await self.list_locations(
                access_token=access_token,
                account_name=account_name,
            )

            locations.extend(
                account_locations
            )

        return locations

    async def get_location(
        self,
        *,
        access_token: str,
        location_name: str,
    ) -> dict:

        if not access_token:
            raise ValueError(
                "Google Business access token is required."
            )

        if not location_name:
            raise ValueError(
                "Google Business location name is required."
            )

        if not location_name.startswith(
            "locations/"
        ):
            raise ValueError(
                "Invalid Google Business location resource name."
            )

        response = await self._google_get(
            url=(
                f"{self.BUSINESS_INFORMATION_BASE_URL}"
                f"/{location_name}"
            ),
            access_token=access_token,
            params={
                "readMask": (
                    "name,"
                    "title,"
                    "storefrontAddress,"
                    "websiteUri,"
                    "phoneNumbers,"
                    "categories,"
                    "metadata"
                )
            },
        )

        return response

    async def _google_get(
        self,
        *,
        url: str,
        access_token: str,
        params: dict | None = None,
    ) -> dict:

        async with httpx.AsyncClient(
            timeout=30
        ) as client:

            response = await client.get(
                url,
                params=params,
                headers={
                    "Authorization": (
                        f"Bearer {access_token}"
                    ),
                    "Accept": "application/json",
                },
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise ValueError(
                "Google Business API returned invalid JSON."
            ) from exc

        if response.status_code >= 400:
            error = payload.get(
                "error",
                {}
            )

            message = error.get(
                "message"
            )

            raise ValueError(
                message
                or "Google Business API request failed."
            )

        if "error" in payload:
            error = payload["error"]

            raise ValueError(
                error.get(
                    "message"
                )
                or "Google Business API request failed."
            )

        return payload

    async def build_credential_for_location(
        self,
        *,
        credential: OAuthCredential,
        location_name: str,
    ) -> OAuthCredential:

        if credential.platform != "google_business":
            raise ValueError(
                "Credential is not a Google Business credential."
            )

        if not credential.access_token:
            raise ValueError(
                "Google Business access token is required."
            )

        if not credential.tenant_id:
            raise ValueError(
                "tenant_id is required."
            )

        if not location_name:
            raise ValueError(
                "Google Business location name is required."
            )

        location = await self.get_location(
            access_token=credential.access_token,
            location_name=location_name,
        )

        verified_location_name = location.get("name")

        if verified_location_name != location_name:
            raise ValueError(
                "The selected Google Business location "
                "could not be verified."
            )

        account_name = (
            location.get("metadata", {})
            .get("account")
        )

        metadata = {
            **(credential.metadata or {}),
            "oauth_provider": "google_business",
            "google_location_name": location_name,
            "google_account_name": account_name,
            "location": location,
        }

        return credential.model_copy(
            update={
                "platform_account_id": location_name,
                "metadata": metadata,
            }
        )