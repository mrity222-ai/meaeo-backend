from abc import ABC, abstractmethod

from app.schemas.credentials import OAuthCredential


class CredentialRepository(ABC):

    @abstractmethod
    def save(
        self,
        credential: OAuthCredential,
    ) -> None:
        
        ...

    @abstractmethod
    def get(
        self,
        tenant_id: str,
        platform: str,
    ) -> OAuthCredential | None:
        ...

    @abstractmethod
    def delete(
        self,
        tenant_id: str,
        platform: str,
    ) -> None:
        ...

    @abstractmethod
    def exists(
        self,
        tenant_id: str,
        platform: str,
    ) -> bool:
        ...

    @abstractmethod
    def save_for_channel(
        self,
        credential: OAuthCredential,
        tenant_id: str,
        business_account_id: int,
        business_channel_id: int,
    ) -> None:
        ...

    @abstractmethod
    def get_for_channel(
        self,
        tenant_id: str,
        business_account_id: int,
        business_channel_id: int,
    ) -> OAuthCredential | None:
        ...

    @abstractmethod
    def delete_for_channel(
        self,
        tenant_id: str,
        business_account_id: int,
        business_channel_id: int,
    ) -> None:
        ...

    @abstractmethod
    def exists_for_channel(
        self,
        tenant_id: str,
        business_account_id: int,
        business_channel_id: int,
    ) -> bool:
        ...