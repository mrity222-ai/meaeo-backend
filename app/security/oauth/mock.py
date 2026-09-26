from datetime import (
    datetime,
    timedelta,
    timezone,
)

from app.schemas.credentials import (
    OAuthCredential,
)
from app.security.oauth.base import (
    OAuthProvider,
)


class MockOAuthProvider(
    OAuthProvider
):

    @property
    def provider_name(self) -> str:

        return "mock"

    def build_authorization_url(
        self,
        state: str,
    ) -> str:

        return (
            "https://mock.local/oauth?"
            f"state={state}"
        )

    async def exchange_code(
        self,
        code: str,
        redirect_uri: str,
        tenant_id: str,
    ) -> OAuthCredential:

        return OAuthCredential(
            tenant_id=tenant_id,
            platform="mock",
            access_token=(
                f"access_{code}"
            ),
            refresh_token=(
                f"refresh_{code}"
            ),
            expires_at=(
                datetime.now(
                    timezone.utc
                )
                + timedelta(hours=1)
            ),
            token_type="Bearer",
            scope="test.read",
            platform_account_id="mock_123",
        )

    async def refresh(
        self,
        credential: OAuthCredential,
    ) -> OAuthCredential:

        return credential.model_copy(
            update={
                "access_token": (
                    credential.access_token
                    + "_refreshed"
                ),
                "expires_at": (
                    datetime.now(
                        timezone.utc
                    )
                    + timedelta(hours=1)
                ),
            }
        )