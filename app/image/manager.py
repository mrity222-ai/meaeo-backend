from app.image.asset_selector import AssetSelector
from app.image.prompt_builder import ImagePromptBuilder
from app.image.schemas import PreparedImage
from app.image.style_builder import StyleBuilder


class ImageManager:
    def __init__(self):
        self.asset_selector = AssetSelector()
        self.style_builder = StyleBuilder()
        self.prompt_builder = ImagePromptBuilder()

    def prepare(
        self,
        brand,
        post,
    ):

        assets = self.asset_selector.select(
            brand,
            post,
        )
        style = self.style_builder.build(
            brand,
        )
        prompt = self.prompt_builder.build(
            post,
            style,
            assets,
        )
        return PreparedImage(
            prompt=prompt,
            assets=assets,
            style=style,
        )