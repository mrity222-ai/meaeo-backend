from abc import ABC, abstractmethod

from app.schemas.oauth import OAuthTransaction


class OAuthTransactionRepository(ABC):

    @abstractmethod
    def save(
        self,
        transaction: OAuthTransaction,
    ) -> None:
        ...

    @abstractmethod
    def get(
        self,
        transaction_id: str,
    ) -> OAuthTransaction | None:
        ...

    @abstractmethod
    def get_by_state(
        self,
        state: str,
    ) -> OAuthTransaction | None:
        ...

    @abstractmethod
    def delete(
        self,
        transaction_id: str,
    ) -> None:
        ...

    @abstractmethod
    def exists(
        self,
        transaction_id: str,
    ) -> bool:
        ...