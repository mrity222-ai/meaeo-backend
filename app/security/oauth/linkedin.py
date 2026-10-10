from __future__ import annotations

from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx

from app.models.config import settings
from app.schemas.credentials import OAuthCredential
from app.security.oauth.base import OAuthProvider


class LinkedInOAuthProvider(OAuthProvider):
    """
    OAuth provider for LinkedIn OAuth 2.0 (OpenID Connect & Social API).
    Supports publishing to Personal Profiles and Company Pages.
    """

    LINKEDIN_AUTHORIZATION_URL = "https://www.linkedin.com/oauth/v2/authorization"
    LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
    LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo"
    LINKEDIN_ORGANIZATIONS_URL = (
        "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee"
    )

    DEFAULT_SCOPE = "openid profile email w_member_social"

    @property
    def provider_name(self) -> str:
        return "linkedin"

    def _client_id(self) -> str:
        client_id = getattr(settings, "LINKEDIN_CLIENT_ID", None)
        if not client_id:
            raise ValueError("LINKEDIN_CLIENT_ID is not configured.")
        return client_id

    def _client_secret(self) -> str:
        client_secret = getattr(settings, "LINKEDIN_CLIENT_SECRET", None)
        if not client_secret:
            raise ValueError("LINKEDIN_CLIENT_SECRET is not configured.")
        return client_secret.get_secret_value()

    def _redirect_uri(self) -> str:
        redirect_uri = getattr(settings, "LINKEDIN_REDIRECT_URI", None)
        if not redirect_uri:
            raise ValueError("LINKEDIN_REDIRECT_URI is not configured.")
        return redirect_uri.strip()

    def build_authorization_url(self, state: str) -> str:
        params = {
            "response_type": "code",
            "client_id": self._client_id(),
            "redirect_uri": self._redirect_uri(),
            "state": state,
            "scope": settings.LINKEDIN_OAUTH_SCOPES,
        }
        return f"{self.LINKEDIN_AUTHORIZATION_URL}?{urlencode(params)}"

    async def exchange_code(
        self,
        code: str,
        redirect_uri: str,
        tenant_id: str,
    ) -> OAuthCredential:
        if not tenant_id:
            raise ValueError("tenant_id is required for LinkedIn OAuth exchange.")

        configured_redirect = self._redirect_uri()
        if redirect_uri != configured_redirect:
            raise ValueError(
                f"redirect_uri '{redirect_uri}' does not match configured '{configured_redirect}'."
            )

        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": configured_redirect,
            "client_id": self._client_id(),
            "client_secret": self._client_secret(),
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                self.LINKEDIN_TOKEN_URL,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if resp.status_code != 200:
                raise ValueError(
                    f"LinkedIn token exchange failed ({resp.status_code}): {resp.text}"
                )

            token_data = resp.json()
            access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 5184000)  # default 60 days
            refresh_token = token_data.get("refresh_token")
            scope = token_data.get("scope", settings.LINKEDIN_OAUTH_SCOPES)

            # Fetch user info
            userinfo_resp = await client.get(
                self.LINKEDIN_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )

            userinfo = {}
            if userinfo_resp.status_code == 200:
                userinfo = userinfo_resp.json()

            sub = userinfo.get("sub", "")
            name = userinfo.get("name", "LinkedIn User")
            email = userinfo.get("email", "")

            expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

            return OAuthCredential(
                tenant_id=tenant_id,
                platform=self.provider_name,
                access_token=access_token,
                refresh_token=refresh_token,
                expires_at=expires_at,
                token_type=token_data.get("token_type", "Bearer"),
                scope=scope,
                platform_account_id=sub,
                metadata={
                    "sub": sub,
                    "name": name,
                    "email": email,
                    "picture": userinfo.get("picture"),
                },
            )

    async def refresh(
        self,
        credential: OAuthCredential,
    ) -> OAuthCredential:
        if not credential.refresh_token:
            return credential

        data = {
            "grant_type": "refresh_token",
            "refresh_token": credential.refresh_token,
            "client_id": self._client_id(),
            "client_secret": self._client_secret(),
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                self.LINKEDIN_TOKEN_URL,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if resp.status_code != 200:
                raise ValueError(
                    f"LinkedIn token refresh failed ({resp.status_code}): {resp.text}"
                )

            token_data = resp.json()
            credential.access_token = token_data.get("access_token", credential.access_token)
            if "refresh_token" in token_data:
                credential.refresh_token = token_data["refresh_token"]
            if "expires_in" in token_data:
                credential.expires_at = datetime.now(timezone.utc) + timedelta(
                    seconds=token_data["expires_in"]
                )

            return credential

    async def get_available_accounts(self, access_token: str) -> list[dict]:
        """
        Fetches the LinkedIn personal profile and any organization/company pages
        the user has administrator rights to publish to.
        """
        accounts: list[dict] = []

        async with httpx.AsyncClient(timeout=20.0) as client:
            # 1. Personal Profile
            userinfo_resp = await client.get(
                self.LINKEDIN_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )

            if userinfo_resp.status_code == 200:
                info = userinfo_resp.json()
                sub = info.get("sub", "")
                accounts.append({
                    "platform": "linkedin",
                    "type": "profile",
                    "external_account_id": f"urn:li:person:{sub}" if not sub.startswith("urn:li:") else sub,
                    "account_name": info.get("name", "LinkedIn Profile"),
                    "email": info.get("email"),
                    "picture": info.get("picture"),
                })

            # 2. Organization Pages (if organizationalEntityAcls scope or token permits)
            try:
                org_resp = await client.get(
                    self.LINKEDIN_ORGANIZATIONS_URL,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "X-Restli-Protocol-Version": "2.0.0",
                    },
                )
                if org_resp.status_code == 200:
                    org_data = org_resp.json()
                    elements = org_data.get("elements", [])
                    for el in elements:
                        org_urn = el.get("organizationalTarget", "")
                        if org_urn:
                            accounts.append({
                                "platform": "linkedin",
                                "type": "organization",
                                "external_account_id": org_urn,
                                "account_name": f"LinkedIn Organization ({org_urn.split(':')[-1]})",
                            })
            except Exception:
                pass  # Profile fallback is always present

        return accounts
