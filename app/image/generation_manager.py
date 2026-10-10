from pathlib import Path
import shutil

from app.image.cache import ImageCache
from app.image.catalogue import scoped_image_output
from app.image.provider_factory import (
    ImageProviderFactory,
)
from app.image.schemas import GeneratedImageResult


class ImageGenerationManager:

    def __init__(self):
        self.cache = ImageCache()

    @property
    def provider(self):
        return ImageProviderFactory.get()

    def generate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:

        output_path = scoped_image_output(output_path)
        provider = self.provider  # Validate production configuration even on cache hits.
        if self.cache.exists(prompt):
            output_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(self.cache.load(prompt), output_path)
            return GeneratedImageResult(
                image_path=output_path,
                provider="cache",
                prompt=prompt,
            )
        result = provider.generate(
            prompt,
            output_path,
        )
        self.cache.save(
            prompt,
            result.image_path,
            provider=result.provider,
        )
        return result

    async def agenerate(
        self,
        prompt: str,
        output_path: Path,
    ):

        output_path = scoped_image_output(output_path)
        provider = self.provider  # Validate production configuration even on cache hits.
        if self.cache.exists(prompt):
            output_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(self.cache.load(prompt), output_path)
            return GeneratedImageResult(
                image_path=output_path,
                provider="cache",
                prompt=prompt,
            )

        result = await provider.agenerate(
            prompt,
            output_path,
        )
        self.cache.save(
            prompt,
            result.image_path,
            provider=result.provider,
        )
        return result