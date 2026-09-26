from app.schemas.credentials import OAuthCredential
from app.security.oauth.base import OAuthProvider


class OAuthService:

    def __init__(
        self,
        providers: dict[str, OAuthProvider],
    ):

        self.providers = {
            name.lower(): provider
            for name, provider
            in providers.items()
        }

    def get_provider(
        self,
        platform: str,
    ) -> OAuthProvider:

        name = platform.lower()

        try:
            return self.providers[name]

        except KeyError:

            raise ValueError(
                f"Unsupported OAuth platform: {name}"
            )

    def build_authorization_url(
        self,
        platform: str,
        state: str,
    ) -> str:

        provider = self.get_provider(
            platform
        )

        return provider.build_authorization_url(
            state
        )

    async def exchange_code(
        self,
        platform: str,
        code: str,
        redirect_uri: str,
        tenant_id: str,
    ) -> OAuthCredential:

        if not tenant_id:
            raise ValueError(
                "tenant_id is required for "
                "OAuth credential exchange."
            )

        provider = self.get_provider(
            platform
        )

        credential = await provider.exchange_code(
            code,
            redirect_uri,
            tenant_id,
        )

        if credential.tenant_id != tenant_id:
            raise ValueError(
                "OAuth credential tenant does "
                "not match requested tenant."
            )

        return credential

    async def refresh(
        self,
        credential: OAuthCredential,
    ) -> OAuthCredential:

        provider = self.get_provider(
            credential.platform
        )

        refreshed = await provider.refresh(
            credential
        )

        if (
            refreshed.tenant_id
            != credential.tenant_id
        ):
            raise ValueError(
                "Refreshed OAuth credential tenant "
                "does not match original tenant."
            )

        return refreshed