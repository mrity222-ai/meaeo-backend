from pathlib import Path
from typing import ClassVar

from app.utils.asset_loader import AssetLoader


class CatalogueAssetRepository:
    """
    Provides access to catalogue images belonging to a brand.
    """

    CATEGORY = "catalogue"

    SUPPORTED_EXTENSIONS: ClassVar[set[str]] = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }

    def __init__(
        self,
        loader: AssetLoader | None = None,
    ):
        self.loader = loader or AssetLoader()

    def list(
        self,
        brand_name: str,
    ) -> list[Path]:

        assets = self.loader.list_assets(
            brand_name,
            self.CATEGORY,
        )

        return [
            asset
            for asset in assets
            if asset.suffix.lower()
            in self.SUPPORTED_EXTENSIONS
        ]

    def get(
        self,
        brand_name: str,
        filename: str,
    ) -> Path:

        assets = self.list(
            brand_name
        )
        for asset in assets:

            if asset.name == filename:
                return asset

        raise FileNotFoundError(
            f"Catalogue asset '{filename}' "
            f"not found for brand '{brand_name}'."
        )

    def exists(
        self,
        brand_name: str,
        filename: str,
    ) -> bool:

        try:
            self.get(
                brand_name,
                filename,
            )
            return True

        except FileNotFoundError:
            return False