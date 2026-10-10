from contextlib import contextmanager
from contextvars import ContextVar
from pathlib import Path
from typing import ClassVar

from app.utils.asset_loader import AssetLoader


_campaign_output: ContextVar[Path | None] = ContextVar("campaign_output", default=None)
_campaign_cache_namespace: ContextVar[str] = ContextVar("campaign_cache_namespace", default="")


def scoped_image_output(path: str | Path) -> Path:
    root = _campaign_output.get()
    if root is None:
        return Path(path)
    root.mkdir(parents=True, exist_ok=True)
    return root / Path(path).name


_campaign_catalogue: ContextVar[tuple[Path, ...] | None] = ContextVar("campaign_catalogue", default=None)


@contextmanager
def campaign_catalogue_scope(paths: list[Path], *, output_root: Path | None = None, namespace: str = ""):
    output_token = _campaign_output.set(output_root)
    cache_token = _campaign_cache_namespace.set(namespace)
    token = _campaign_catalogue.set(tuple(paths))
    try:
        yield
    finally:
        _campaign_catalogue.reset(token)
        _campaign_output.reset(output_token)
        _campaign_cache_namespace.reset(cache_token)


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
        self.loader = loader

    def list(
        self,
        brand_name: str,
    ) -> list[Path]:

        scoped = _campaign_catalogue.get()
        if scoped is not None:
            if any(not path.is_file() for path in scoped):
                raise ValueError("A selected business catalogue asset is missing.")
            return list(scoped)
        loader = self.loader or AssetLoader()
        assets = loader.list_assets(
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