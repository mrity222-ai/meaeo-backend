from __future__ import annotations

from app.schemas.brand import BrandProfile
from app.utils.asset_loader import AssetLoader


class BrandRepository:
    """
    Repository responsible for loading and validating
    brand resources from disk.
    """

    def __init__(self, loader: AssetLoader | None = None):
        self.loader = loader or AssetLoader()

    def load(self, brand_name: str = "brand_001") -> BrandProfile:
        """
        Load an entire BrandProfile.
        """

        brand = self.loader.load_json(
            brand_name,
            "brand.json",
        )
        colors = self.loader.load_json(
            brand_name,
            "colors.json",
        )
        fonts = self.loader.load_json(
            brand_name,
            "fonts.json",
        )
        voice = self.loader.load_json(
            brand_name,
            "voice.json",
        )
        visual = self.loader.load_json(
            brand_name,
            "visual.json"
        )
        hashtags = self.loader.load_json(
            brand_name,
            "hashtags.json",
        )
        products = self.loader.load_json(
            brand_name,
            "products.json",
        )
        logos = self._load_assets(
            brand_name,
            "logos",
        )
        templates = self._load_assets(
            brand_name,
            "templates",
        )
        

        schema = BrandProfile(
            name=brand["name"],
            website=brand["website"],

            primary_color=colors["primary"],
            secondary_color=colors["secondary"],

            fonts=fonts,
            voice=voice,
            visual=visual,

            hashtags=hashtags["hashtags"],
            products=products["products"],

            logos=logos,
            templates=templates,
            contact_details=brand.get(
                "contact_details",
                {},
            ),
        )
        return BrandProfile(**schema.model_dump())

    def _load_assets(
        self,
        brand_name: str,
        folder: str,
    ) -> dict[str, str]:

        files = self.loader.list_assets(
            brand_name,
            folder,
        )

        return {
            file.stem: str(file)
            for file in files
        }