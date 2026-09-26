from pathlib import Path

from app.repositories.oauth_transaction_repository import (
    OAuthTransactionRepository,
)
from app.schemas.oauth import OAuthTransaction
from app.storage.base import BaseStorage
from app.storage.factory import StorageFactory


class LocalOAuthTransactionRepository(
    OAuthTransactionRepository
):

    ROOT = Path(
        "data/oauth_transactions"
    )

    def __init__(
        self,
        storage: BaseStorage | None = None,
    ):

        self.ROOT.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.storage = (
            storage
            if storage is not None
            else StorageFactory.create()
        )

    def _path(
        self,
        transaction_id: str,
    ) -> Path:

        return (
            self.ROOT
            / f"{transaction_id}.json"
        )

    def save(
        self,
        transaction: OAuthTransaction,
    ) -> None:

        path = self._path(
            transaction.transaction_id
        )

        path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.storage.save(
            path,
            transaction.model_dump(
                mode="json"
            ),
        )

    def get(
        self,
        transaction_id: str,
    ) -> OAuthTransaction | None:

        path = self._path(
            transaction_id
        )

        if not self.storage.exists(path):
            return None

        data = self.storage.load(path)

        return OAuthTransaction.model_validate(
            data
        )

    def get_by_state(
        self,
        state: str,
    ) -> OAuthTransaction | None:

        normalized_state = state.strip()

        if not normalized_state:
            return None

        for path in self.storage.list(self.ROOT):

            data = self.storage.load(path)

            if (
                data.get("state")
                == normalized_state
            ):
                return OAuthTransaction.model_validate(
                    data
                )

        return None

    def delete(
        self,
        transaction_id: str,
    ) -> None:

        path = self._path(
            transaction_id
        )

        if self.storage.exists(path):
            self.storage.delete(path)

    def exists(
        self,
        transaction_id: str,
    ) -> bool:

        path = self._path(
            transaction_id
        )

        return self.storage.exists(path)