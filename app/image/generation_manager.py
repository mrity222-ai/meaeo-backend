from pathlib import Path

from app.image.cache import ImageCache
from app.image.provider_factory import (
    ImageProviderFactory,
)
from app.image.schemas import GeneratedImageResult


class ImageGenerationManager:

    def __init__(self):

        self.provider = (
            ImageProviderFactory.get()
        )
        self.cache = ImageCache()

    def generate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:

        if self.cache.exists(prompt):
            return GeneratedImageResult(
                image_path=self.cache.load(prompt),
                provider="cache",
                prompt=prompt,
            )
        result = self.provider.generate(
            prompt,
            output_path,
        )
        cached = self.cache.save(
            prompt,
            result.image_path,
        )
        result.image_path = cached
        return result

    async def agenerate(
        self,
        prompt: str,
        output_path: Path,
    ):

        if self.cache.exists(prompt):
            return GeneratedImageResult(
                image_path=self.cache.load(prompt),
                provider="cache",
                prompt=prompt,
            )

        result = await self.provider.agenerate(
            prompt,
            output_path,
        )
        cached = self.cache.save(
            prompt,
            result.image_path,
        )
        result.image_path = cached
        return result