from abc import ABC, abstractmethod

from app.schemas.credentials import OAuthCredential


class OAuthProvider(ABC):

    @property
    @abstractmethod
    def provider_name(self) -> str:
        ...

    @abstractmethod
    def build_authorization_url(
        self,
        state: str,
    ) -> str:
        ...

    @abstractmethod
    async def exchange_code(
        self,
        code: str,
        redirect_uri: str,
        tenant_id: str,
    ) -> OAuthCredential:
        ...

    @abstractmethod
    async def refresh(
        self,
        credential: OAuthCredential,
    ) -> OAuthCredential:
        ...