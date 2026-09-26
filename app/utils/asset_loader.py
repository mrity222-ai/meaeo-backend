from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class AssetLoader:
    """
    Handles loading brand configuration files and asset paths.

    Responsibilities:
    - Resolve brand directories
    - Load JSON configuration files
    - List assets

    Does NOT:
    - Validate data
    - Build BrandProfile
    - Update application state
    """

    def __init__(self, brands_root: Path | None = None):
        if brands_root is not None:
            self.brands_root = Path(brands_root)
            return

        current = Path(__file__).resolve()
        project_root = current.parent.parent.parent

        self.brands_root = project_root / "brands"

        if not self.brands_root.exists():
            raise FileNotFoundError(
                f"Brands directory not found: {self.brands_root}"
            )

    def get_brand_path(self, brand_name: str) -> Path:
        brand_path = self.brands_root / brand_name

        if not brand_path.exists():
            raise FileNotFoundError(
                f"Brand '{brand_name}' not found: {brand_path}"
            )

        return brand_path

    def load_json(
        self,
        brand_name: str,
        filename: str,
    ) -> dict[str, Any]:

        config_file = (
            self.get_brand_path(brand_name)
            / "configs"
            / filename
        )

        if not config_file.exists():
            raise FileNotFoundError(
                f"Missing config file: {config_file}"
            )

        with open(
            config_file,
            "r",
            encoding="utf-8",
        ) as file:
            return json.load(file)

    def list_assets(
        self,
        brand_name: str,
        category: str,
    ) -> list[Path]:

        asset_dir = (
            self.get_brand_path(brand_name)
            / "assets"
            / category
        )

        if not asset_dir.exists():
            return []

        return sorted(
            [
                file
                for file in asset_dir.iterdir()
                if file.is_file()
            ]
        )