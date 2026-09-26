import secrets
from datetime import datetime, timedelta, timezone

from app.repositories.oauth_transaction_repository import (
    OAuthTransactionRepository,
)
from app.schemas.oauth import OAuthTransaction
from app.security.oauth.state import (
    OAuthStateManager,
)


class OAuthTransactionService:

    TRANSACTION_TTL_MINUTES = 10

    def __init__(
        self,
        repository: OAuthTransactionRepository,
    ):
        self.repository = repository

    # -----------------------------------------------------
    # Create
    # -----------------------------------------------------

    def create(
        self,
        tenant_id: str,
        business_account_id: int,
        platform: str,
        redirect_uri: str,
    ) -> OAuthTransaction:

        if not tenant_id:
            raise ValueError(
                "tenant_id is required."
            )

        if business_account_id <= 0:
            raise ValueError(
                "business_account_id must be positive."
            )

        platform = platform.strip().lower()

        if not platform:
            raise ValueError(
                "platform is required."
            )

        redirect_uri = redirect_uri.strip()

        if not redirect_uri:
            raise ValueError(
                "redirect_uri is required."
            )

        now = datetime.now(
            timezone.utc
        )

        transaction = OAuthTransaction(
            transaction_id=secrets.token_urlsafe(
                32
            ),
            tenant_id=tenant_id,
            business_account_id=business_account_id,
            platform=platform,
            state=OAuthStateManager.generate(),
            redirect_uri=redirect_uri,
            created_at=now,
            expires_at=(
                now
                + timedelta(
                    minutes=self.TRANSACTION_TTL_MINUTES
                )
            ),
            selection_required=False,
            encrypted_access_token=None,
        )

        self.repository.save(
            transaction
        )

        return transaction

    # -----------------------------------------------------
    # Basic retrieval
    # -----------------------------------------------------

    def get(
        self,
        transaction_id: str,
    ) -> OAuthTransaction | None:

        return self.repository.get(
            transaction_id
        )

    def get_by_state(
        self,
        state: str,
    ) -> OAuthTransaction | None:

        return self.repository.get_by_state(
            state
        )

    # -----------------------------------------------------
    # Validation
    # -----------------------------------------------------

    def validate_by_state(
        self,
        state: str,
    ) -> OAuthTransaction:

        transaction = (
            self.repository.get_by_state(
                state
            )
        )

        if transaction is None:
            raise ValueError(
                "OAuth transaction not found."
            )

        return self._validate_transaction(
            transaction
        )

    def validate(
        self,
        transaction_id: str,
        state: str,
    ) -> OAuthTransaction:

        transaction = self.repository.get(
            transaction_id
        )

        if transaction is None:
            raise ValueError(
                "OAuth transaction not found."
            )

        if not OAuthStateManager.validate(
            transaction.state,
            state,
        ):
            raise ValueError(
                "Invalid OAuth state."
            )

        return self._validate_transaction(
            transaction
        )

    def _validate_transaction(
        self,
        transaction: OAuthTransaction,
    ) -> OAuthTransaction:

        if transaction.completed:
            raise ValueError(
                "OAuth transaction already completed."
            )

        now = datetime.now(
            timezone.utc
        )

        if now >= transaction.expires_at:

            self.repository.delete(
                transaction.transaction_id
            )

            raise ValueError(
                "OAuth transaction expired."
            )

        return transaction

    # -----------------------------------------------------
    # Pending account selection
    # -----------------------------------------------------

    def mark_selection_required(
        self,
        transaction_id: str,
        encrypted_access_token: str,
    ) -> OAuthTransaction:

        if not encrypted_access_token:
            raise ValueError(
                "Encrypted access token is required."
            )

        transaction = self.repository.get(
            transaction_id
        )

        if transaction is None:
            raise ValueError(
                "OAuth transaction not found."
            )

        transaction = self._validate_transaction(
            transaction
        )

        transaction.selection_required = True
        transaction.encrypted_access_token = (
            encrypted_access_token
        )

        self.repository.save(
            transaction
        )

        return transaction

    def get_pending_selection(
        self,
        transaction_id: str,
    ) -> OAuthTransaction:

        transaction = self.repository.get(
            transaction_id
        )

        if transaction is None:
            raise ValueError(
                "OAuth transaction not found."
            )

        transaction = self._validate_transaction(
            transaction
        )

        if not transaction.selection_required:
            raise ValueError(
                "OAuth transaction is not awaiting "
                "account selection."
            )

        if not transaction.encrypted_access_token:
            raise ValueError(
                "OAuth transaction has no pending "
                "credential exchange."
            )

        return transaction

    # -----------------------------------------------------
    # Completion
    # -----------------------------------------------------

    def complete(
        self,
        transaction_id: str,
    ) -> None:

        transaction = self.repository.get(
            transaction_id
        )

        if transaction is None:
            return

        transaction.completed = True

        self.repository.delete(
            transaction_id
        )