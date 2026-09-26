from sqlalchemy.orm import Session

from app.repositories.business_account_repository import (
    BusinessAccountRepository,
)
from app.schemas.credentials import OAuthCredential
from app.security.credential_service import CredentialService
from app.security.tenant import TenantContext


class BusinessChannelConnectionService:

    def __init__(
        self,
        db: Session,
        credential_service: CredentialService,
    ):
        self.db = db
        self.repository = (
            BusinessAccountRepository(db)
        )
        self.credential_service = (
            credential_service
        )

    def connect_channel(
        self,
        *,
        context: TenantContext,
        business_account_id: int,
        platform: str,
        external_account_id: str,
        account_name: str,
        credential: OAuthCredential,
        platform_metadata: dict | None = None,
    ):
        """
        Connect one explicitly selected external account
        to one Business Account.

        BusinessChannel.platform identifies the destination
        channel, for example "facebook" or "instagram".

        OAuthCredential.platform identifies the OAuth provider.
        For Meta channels this remains "meta".
        """

        if credential.tenant_id != context.tenant_id:
            raise ValueError(
                "Credential tenant does not match "
                "current tenant."
            )

        if not external_account_id:
            raise ValueError(
                "external_account_id is required."
            )

        if not platform:
            raise ValueError(
                "platform is required."
            )

        platform = platform.lower().strip()

        business_account = (
            self.repository.get_by_id(
                tenant_id=context.tenant_id,
                business_account_id=business_account_id,
            )
        )

        if business_account is None:
            raise ValueError(
                "Business Account not found."
            )

        if business_account.status != "active":
            raise ValueError(
                "Business Account is not active."
            )

        self._validate_credential_provider(
            platform=platform,
            credential=credential,
        )

        self._validate_selected_account(
            platform=platform,
            external_account_id=external_account_id,
            credential=credential,
        )

        existing_channel = (
            self.repository.get_channel(
                tenant_id=context.tenant_id,
                business_account_id=business_account_id,
                platform=platform,
            )
        )

        if existing_channel is not None:

            if (
                existing_channel.external_account_id
                != external_account_id
            ):
                raise ValueError(
                    f"A different {platform} account "
                    "is already connected to this "
                    "Business Account."
                )

            channel = existing_channel

            channel.account_name = account_name
            channel.status = "active"
            channel.is_enabled = True
            channel.platform_metadata = (
                platform_metadata
            )

            self.db.commit()
            self.db.refresh(channel)

        else:

            existing_external = (
                self.repository
                .get_channel_by_external_account(
                    tenant_id=context.tenant_id,
                    platform=platform,
                    external_account_id=(
                        external_account_id
                    ),
                )
            )

            if existing_external is not None:
                raise ValueError(
                    f"The {platform} account is already "
                    "connected to another Business Account."
                )

            channel = (
                self.repository.create_channel(
                    tenant_id=context.tenant_id,
                    business_account_id=(
                        business_account_id
                    ),
                    platform=platform,
                    external_account_id=(
                        external_account_id
                    ),
                    account_name=account_name,
                    platform_metadata=(
                        platform_metadata
                    ),
                )
            )

        self.credential_service.save_for_channel(
            context=context,
            credential=credential,
            business_account_id=business_account_id,
            business_channel_id=channel.id,
        )

        return channel

    @staticmethod
    def _validate_credential_provider(
        *,
        platform: str,
        credential: OAuthCredential,
    ) -> None:
        """
        Validate that the OAuth credential comes from the
        provider responsible for the selected platform.
        """

        meta_platforms = {
            "facebook",
            "instagram",
        }

        if platform in meta_platforms:

            if credential.platform != "meta":
                raise ValueError(
                    f"The {platform} channel requires "
                    "a Meta OAuth credential."
                )

            return

        if credential.platform != platform:
            raise ValueError(
                "Credential platform does not match "
                "the selected platform."
            )

    @staticmethod
    def _validate_selected_account(
        *,
        platform: str,
        external_account_id: str,
        credential: OAuthCredential,
    ) -> None:
        """
        Ensure the credential actually grants access to
        the external account selected by the user.
        """

        metadata = credential.metadata or {}

        if platform == "facebook":

            credential_page_id = metadata.get(
                "facebook_page_id"
            )

            if credential_page_id != external_account_id:
                raise ValueError(
                    "Credential does not belong to "
                    "the selected Facebook Page."
                )

            page_access_token = metadata.get(
                "facebook_page_access_token"
            )

            if not page_access_token:
                raise ValueError(
                    "Meta credential does not contain "
                    "a Facebook Page access token."
                )

            return

        if platform == "instagram":

            credential_instagram_id = metadata.get(
                "instagram_business_account_id"
            )

            if (
                credential_instagram_id
                != external_account_id
            ):
                raise ValueError(
                    "Credential does not belong to "
                    "the selected Instagram account."
                )

            if not credential.access_token:
                raise ValueError(
                    "Meta credential does not contain "
                    "an Instagram access token."
                )

            return

        if (
            credential.platform_account_id
            and credential.platform_account_id
            != external_account_id
        ):
            raise ValueError(
                "Credential account does not match "
                "selected external account."
            )