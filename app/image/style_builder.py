from app.schemas.brand import BrandProfile


class StyleBuilder:

    def build(
        self,
        brand: BrandProfile,
    ) -> dict:

        visual = brand.visual

        return {
            "primary_color": brand.primary_color,
            "secondary_color": brand.secondary_color,
            "style": visual.get(
                "style",
                "modern",
            ),
            "photography": visual.get(
                "photography",
                "commercial",
            ),
            "lighting": visual.get(
                "lighting",
                "natural",
            ),
            "composition": visual.get(
                "composition",
                "minimal",
            ),
            "background": visual.get(
                "background",
                "clean",
            ),
            "logo_position": visual.get(
                "logo_position",
                "top_right",
            ),
            "aspect_ratio": visual.get(
                "preferred_aspect_ratio",
                "1:1",
            ),
        }