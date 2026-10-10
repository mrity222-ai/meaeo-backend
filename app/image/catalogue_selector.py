from pathlib import Path

from app.image.catalogue import (
    CatalogueAssetRepository,
    _campaign_catalogue,
)


class CatalogueSelector:
    """
    Selects catalogue assets for campaign posts.
    """

    def __init__(
        self,
        repository: CatalogueAssetRepository | None = None,
    ):

        self.repository = (
            repository
            or CatalogueAssetRepository()
        )

    def select(
        self,
        brand_name: str,
        *,
        filename: str | None = None,
        index: int = 0,
    ) -> Path:

        if filename:

            return self.repository.get(
                brand_name,
                filename,
            )

        assets = self.repository.list(
            brand_name
        )

        if not assets:
            raise ValueError(
                f"No catalogue assets found "
                f"for brand '{brand_name}'."
            )

        if _campaign_catalogue.get() is not None and index >= 0:
            # Reuse this business's catalogue for longer campaigns.
            index %= len(assets)
        if index < 0 or index >= len(assets):
            raise IndexError(
                "Catalogue asset index out of range."
            )

        return assets[index]