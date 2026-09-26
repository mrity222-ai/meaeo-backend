from app.repositories.credential_repository import (
    CredentialRepository,
)
from app.schemas.credentials import (
    OAuthCredential,
)
from app.security.authorization import (
    TenantAuthorizationService,
)
from app.security.oauth.service import (
    OAuthService,
)
from app.security.tenant import (
    TenantContext,
)


class CredentialService:

    def __init__(
        self,
        repository: CredentialRepository,
        oauth_service: OAuthService | None = None,
    ):

        self.repository = repository
        self.oauth_service = oauth_service

    def save(
        self,
        context: TenantContext,
        credential: OAuthCredential,
    ) -> None:

        TenantAuthorizationService.require_access(
            context,
            credential.tenant_id,
        )

        self.repository.save(
            credential
        )

    def get(
        self,
        context: TenantContext,
        platform: str,
    ) -> OAuthCredential | None:

        credential = self.repository.get(
            context.tenant_id,
            platform,
        )

        if credential is None:
            return None

        TenantAuthorizationService.require_access(
            context,
            credential.tenant_id,
        )

        return credential

    def delete(
        self,
        context: TenantContext,
        platform: str,
    ) -> None:

        self.repository.delete(
            context.tenant_id,
            platform,
        )

    def exists(
        self,
        context: TenantContext,
        platform: str,
    ) -> bool:

        return self.repository.exists(
            context.tenant_id,
            platform,
        )

    def save_for_channel(
        self,
        context: TenantContext,
        credential: OAuthCredential,
        business_account_id: int,
        business_channel_id: int,
    ) -> None:

        if credential.tenant_id != context.tenant_id:
            raise ValueError(
                "Credential tenant does not match "
                "current tenant."
            )

        credential = credential.model_copy(
            update={
                "business_account_id": business_account_id,
                "business_channel_id": business_channel_id,
            }
        )

        self.repository.save_for_channel(
            credential=credential,
            tenant_id=context.tenant_id,
            business_account_id=business_account_id,
            business_channel_id=business_channel_id,
        )

    def get_for_channel(
        self,
        context: TenantContext,
        business_account_id: int,
        business_channel_id: int,
    ) -> OAuthCredential | None:

        credential = (
            self.repository.get_for_channel(
                tenant_id=context.tenant_id,
                business_account_id=business_account_id,
                business_channel_id=business_channel_id,
            )
        )

        if credential is None:
            return None

        if credential.tenant_id != context.tenant_id:
            raise ValueError(
                "Credential tenant does not match "
                "current tenant."
            )

        return credential

    def delete_for_channel(
        self,
        context: TenantContext,
        business_account_id: int,
        business_channel_id: int,
    ) -> None:

        self.repository.delete_for_channel(
            tenant_id=context.tenant_id,
            business_account_id=business_account_id,
            business_channel_id=business_channel_id,
        )

    def exists_for_channel(
        self,
        context: TenantContext,
        business_account_id: int,
        business_channel_id: int,
    ) -> bool:

        return self.repository.exists_for_channel(
            tenant_id=context.tenant_id,
            business_account_id=business_account_id,
            business_channel_id=business_channel_id,
        )

    async def get_valid_credential(
        self,
        context: TenantContext,
        platform: str,
    ) -> OAuthCredential:

        credential = self.get(
            context,
            platform,
        )

        if credential is None:
            raise ValueError(
                "OAuth credential not found."
            )

        if not credential.is_expired(
            buffer_seconds=60
        ):
            return credential

        if not credential.refresh_token:
            raise ValueError(
                "OAuth credential expired and "
                "has no refresh token."
            )

        if self.oauth_service is None:
            raise RuntimeError(
                "OAuth service is required "
                "for token refresh."
            )

        refreshed = (
            await self.oauth_service.refresh(
                credential
            )
        )

        self.save(
            context,
            refreshed,
        )

        return refreshed

    async def get_valid_credential_for_channel(
        self,
        context: TenantContext,
        business_account_id: int,
        business_channel_id: int,
    ) -> OAuthCredential:

        credential = self.get_for_channel(
            context=context,
            business_account_id=business_account_id,
            business_channel_id=business_channel_id,
        )

        if credential is None:
            raise ValueError(
                "OAuth credential not found for "
                "business channel."
            )

        if not credential.is_expired(
            buffer_seconds=60
        ):
            return credential

        if not credential.refresh_token:
            raise ValueError(
                "OAuth credential expired and "
                "has no refresh token."
            )

        if self.oauth_service is None:
            raise RuntimeError(
                "OAuth service is required "
                "for token refresh."
            )

        refreshed = (
            await self.oauth_service.refresh(
                credential
            )
        )

        self.save_for_channel(
            context=context,
            credential=refreshed,
            business_account_id=business_account_id,
            business_channel_id=business_channel_id,
        )

        return refreshed