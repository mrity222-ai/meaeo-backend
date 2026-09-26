from pathlib import Path

from app.schemas.campaign_bundle import CampaignBundle
from app.storage.base import BaseStorage
from app.storage.factory import StorageFactory


class CampaignRepository:

    ROOT = Path("data/campaigns")

    def __init__(
        self,
        storage: BaseStorage | None = None,
    ):
        self.storage = (
            storage
            if storage is not None
            else StorageFactory.create()
        )

        self.ROOT.mkdir(
            parents=True,
            exist_ok=True,
        )

    @staticmethod
    def _tenant_key(
        tenant_id: str,
    ) -> str:

        tenant_id = tenant_id.strip().lower()

        if not tenant_id:
            raise ValueError(
                "tenant_id cannot be empty."
            )

        return tenant_id

    @staticmethod
    def _filename(
        campaign_name: str,
    ) -> str:

        filename = (
            campaign_name
            .strip()
            .replace(" ", "_")
            .lower()
        )

        if not filename:
            raise ValueError(
                "campaign_name cannot be empty."
            )

        return filename

    def _path(
        self,
        tenant_id: str,
        campaign_name: str,
    ) -> Path:

        tenant = self._tenant_key(
            tenant_id
        )

        filename = self._filename(
            campaign_name
        )

        return (
            self.ROOT
            / tenant
            / f"{filename}.json"
        )

    def save(
        self,
        tenant_id: str,
        bundle: CampaignBundle,
    ) -> Path:

        path = self._path(
            tenant_id,
            bundle.campaign.campaign_name,
        )

        data = bundle.model_dump(
            mode="json"
        )

        self.storage.save(
            path,
            data,
        )

        return path

    def load(
        self,
        tenant_id: str,
        campaign_name: str,
    ) -> CampaignBundle:

        path = self._path(
            tenant_id,
            campaign_name,
        )

        data = self.storage.load(
            path
        )

        return CampaignBundle.model_validate(
            data
        )

    def exists(
        self,
        tenant_id: str,
        campaign_name: str,
    ) -> bool:

        path = self._path(
            tenant_id,
            campaign_name,
        )

        return self.storage.exists(
            path
        )