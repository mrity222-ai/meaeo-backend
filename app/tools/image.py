from pathlib import Path

from app.models.image.factory import ImageProviderFactory


class ImageTool:

    def __init__(self):

        self.provider = ImageProviderFactory.get_provider()

    def generate(
        self,
        prompt: str,
        output_path: Path,
    ) -> Path:

        return self.provider.generate(
            prompt=prompt,
            output_path=output_path,
        )

    async def agenerate(
        self,
        prompt: str,
        output_path: Path,
    ) -> Path:

        return await self.provider.agenerate(
            prompt=prompt,
            output_path=output_path,
        )