import shutil
from pathlib import Path

from app.image.base import BaseImageProvider
from app.image.schemas import GeneratedImageResult


class MockImageProvider(BaseImageProvider):

    @property
    def provider_name(self):

        return "mock"

    def generate(
        self,
        prompt,
        output_path,
    ):
        placeholder = Path(
            "data/assets/mock.png"
        )
        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )
        if placeholder.exists():
            shutil.copy2(
                placeholder,
                output_path,
            )
        else:
            from PIL import Image, ImageDraw
            img = Image.new("RGB", (1080, 1080), color=(24, 24, 27))
            draw = ImageDraw.Draw(img)
            draw.rectangle([40, 40, 1040, 1040], outline=(63, 63, 70), width=4)
            img.save(output_path, format="PNG")

        return GeneratedImageResult(
            image_path=output_path,
            provider="mock",
            prompt=prompt,
        )

    async def agenerate(
        self,
        prompt,
        output_path,
    ):
        return self.generate(
            prompt,
            output_path,
        )