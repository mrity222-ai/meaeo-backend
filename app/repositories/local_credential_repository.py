from pathlib import Path

from app.repositories.credential_repository import (
    CredentialRepository,
)
from app.schemas.credentials import (
    OAuthCredential,
)
from app.security.encryption import (
    EncryptionService,
)
from app.storage.base import BaseStorage
from app.storage.factory import StorageFactory

class LocalCredentialRepository(
    CredentialRepository
):

    ROOT = Path(
        "data/credentials"
    )

    def __init__(
        self,
        encryption: EncryptionService,
        storage: BaseStorage | None = None,
    ):
        self.ROOT = Path(
            "data/credentials"
        )
        self.ROOT.mkdir(
            parents=True,
            exist_ok=True,
        )
        self.encryption = encryption

        self.storage = (
            storage
            if storage is not None
            else StorageFactory.create()
        )

    def _path(
        self,
        tenant_id: str,
        platform: str,
    ) -> Path:

        tenant = (
            tenant_id
            .strip()
            .lower()
        )

        platform = (
            platform
            .strip()
            .lower()
        )

        return (
            self.ROOT
            / tenant
            / f"{platform}.json"
        )

    def _channel_path(
        self,
        tenant_id: str,
        business_account_id: int,
        business_channel_id: int,
    ) -> Path:

        tenant = (
            tenant_id
            .strip()
            .lower()
        )

        return (
            self.ROOT
            / tenant
            / "business_accounts"
            / str(business_account_id)
            / "channels"
            / f"{business_channel_id}.json"
        )

    def save(
        self,
        credential: OAuthCredential,
    ) -> None:

        path = self._path(
            credential.tenant_id,
            credential.platform,
        )

        path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        data = credential.model_dump(
            mode="json"
        )

        data["access_token"] = (
            self.encryption.encrypt(
                credential.access_token
            )
        )

        if credential.refresh_token:
            data["refresh_token"] = (
                self.encryption.encrypt(
                    credential.refresh_token
                )
            )

        if credential.page_access_token:
            data["page_access_token"] = (
                self.encryption.encrypt(
                    credential.page_access_token
                )
            )

        self.storage.save(
            path,
            data,
        )

    def save_for_channel(
        self,
        credential: OAuthCredential,
        tenant_id: str,
        business_account_id: int,
        business_channel_id: int,
    ) -> None:

        path = self._channel_path(
            tenant_id,
            business_account_id,
            business_channel_id,
        )

        path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        data = credential.model_copy(
            update={
                "tenant_id": tenant_id,
                "business_account_id": business_account_id,
                "business_channel_id": business_channel_id,
            }
        ).model_dump(
            mode="json"
        )

        data["access_token"] = (
            self.encryption.encrypt(
                credential.access_token
            )
        )

        if credential.refresh_token:
            data["refresh_token"] = (
                self.encryption.encrypt(
                    credential.refresh_token
                )
            )

        if credential.page_access_token:
            data["page_access_token"] = (
                self.encryption.encrypt(
                    credential.page_access_token
                )
            )

        self.storage.save(
            path,
            data,
        )

    def get_for_channel(
        self,
        tenant_id: str,
        business_account_id: int,
        business_channel_id: int,
    ) -> OAuthCredential | None:

        path = self._channel_path(
            tenant_id,
            business_account_id,
            business_channel_id,
        )

        if not self.storage.exists(path):
            return None

        data = self.storage.load(path)

        data["access_token"] = (
            self.encryption.decrypt(
                data["access_token"]
            )
        )

        if data.get("refresh_token"):
            data["refresh_token"] = (
                self.encryption.decrypt(
                    data["refresh_token"]
                )
            )

        if data.get("page_access_token"):
            data["page_access_token"] = (
                self.encryption.decrypt(
                    data["page_access_token"]
                )
            )

        return OAuthCredential.model_validate(
            data
        )

    def delete_for_channel(
        self,
        tenant_id: str,
        business_account_id: int,
        business_channel_id: int,
    ) -> None:

        path = self._channel_path(
            tenant_id,
            business_account_id,
            business_channel_id,
        )

        if self.storage.exists(path):
            self.storage.delete(path)

    def exists_for_channel(
        self,
        tenant_id: str,
        business_account_id: int,
        business_channel_id: int,
    ) -> bool:

        path = self._channel_path(
            tenant_id,
            business_account_id,
            business_channel_id,
        )

        return self.storage.exists(path)

    def get(
        self,
        tenant_id: str,
        platform: str,
    ) -> OAuthCredential | None:

        path = self._path(
            tenant_id,
            platform,
        )

        if not self.storage.exists(path):
            return None

        data = self.storage.load(path)

        data["access_token"] = (
            self.encryption.decrypt(
                data["access_token"]
            )
        )

        if data.get("refresh_token"):
            data["refresh_token"] = (
                self.encryption.decrypt(
                    data["refresh_token"]
                )
            )

        if data.get("page_access_token"):
            data["page_access_token"] = (
                self.encryption.decrypt(
                    data["page_access_token"]
                )
            )

        return OAuthCredential.model_validate(
            data
        )
    
    def delete(
        self,
        tenant_id: str,
        platform: str,
    ) -> None:

        path = self._path(
            tenant_id,
            platform,
        )

        if self.storage.exists(path):
            self.storage.delete(path)

    def exists(
        self,
        tenant_id: str,
        platform: str,
    ) -> bool:

        path = self._path(
            tenant_id,
            platform,
        )

        return self.storage.exists(path)