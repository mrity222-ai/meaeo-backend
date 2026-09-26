from app.schemas.brand import BrandProfile


class AssetSelector:
    """
    Selects the most appropriate visual assets
    for a content post.
    """

    def select(
        self,
        brand: BrandProfile,
        post,
    ) -> dict:
        return {
            "logo": self._first_asset(
                brand.logos
            ),
            "template": self._first_asset(
                brand.templates
            ),
            "product": self._match_product(
                brand,
                post,
            ),
            "icons": [],
        }

    def _first_asset(
        self,
        assets: dict,
    ):
        if not assets:
            return None

        return next(
            iter(
                assets.values()
            )
        )

    def _match_product(
        self,
        brand,
        post,
    ):
        if not brand.products:
            return None
        return brand.products[0]