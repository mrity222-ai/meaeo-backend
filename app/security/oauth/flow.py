from app.schemas.credentials import (
    OAuthCredential,
)
from app.security.oauth.service import (
    OAuthService,
)
from app.security.oauth.transaction import (
    OAuthTransactionService,
)


class OAuthFlowService:

    def __init__(
        self,
        transaction_service: OAuthTransactionService,
        oauth_service: OAuthService,
    ):

        self.transaction_service = (
            transaction_service
        )

        self.oauth_service = (
            oauth_service
        )

    # -----------------------------------------------------
    # Standard exchange
    # -----------------------------------------------------

    async def exchange(
        self,
        state: str,
        code: str,
    ) -> OAuthCredential:

        transaction = (
            self.transaction_service
            .validate_by_state(
                state
            )
        )

        credential = (
            await self.oauth_service.exchange_code(
                platform=transaction.platform,
                code=code,
                redirect_uri=(
                    transaction.redirect_uri
                ),
                tenant_id=transaction.tenant_id,
            )
        )

        if (
            credential.tenant_id
            != transaction.tenant_id
        ):

            raise ValueError(
                "OAuth credential tenant does "
                "not match transaction tenant."
            )

        if (
            credential.platform.lower()
            != transaction.platform.lower()
        ):

            raise ValueError(
                "OAuth credential platform does "
                "not match transaction platform."
            )

        self.transaction_service.complete(
            transaction.transaction_id
        )

        return credential

    # -----------------------------------------------------
    # Pending-selection exchange
    # -----------------------------------------------------

    async def exchange_for_selection(
        self,
        state: str,
        code: str,
    ) -> OAuthCredential:

        transaction = (
            self.transaction_service
            .validate_by_state(
                state
            )
        )

        credential = (
            await self.oauth_service.exchange_code(
                platform=transaction.platform,
                code=code,
                redirect_uri=(
                    transaction.redirect_uri
                ),
                tenant_id=transaction.tenant_id,
            )
        )

        if (
            credential.tenant_id
            != transaction.tenant_id
        ):

            raise ValueError(
                "OAuth credential tenant does "
                "not match transaction tenant."
            )

        if (
            credential.platform.lower()
            != transaction.platform.lower()
        ):

            raise ValueError(
                "OAuth credential platform does "
                "not match transaction platform."
            )

        return credential