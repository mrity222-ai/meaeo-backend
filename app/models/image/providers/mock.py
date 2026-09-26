from pathlib import Path

from PIL import Image, ImageDraw

from app.models.image.base import BaseImageProvider


class MockImageProvider(BaseImageProvider):

    def __init__(self, model=None):
        self.model = model

    def generate(
        self,
        prompt: str,
        output_path: Path,
    ) -> Path:

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        image = Image.new(
            "RGB",
            (1024, 1024),
            "white",
        )

        draw = ImageDraw.Draw(image)

        text = (
            "Mock Image\n\n"
            f"{prompt[:200]}"
        )

        draw.multiline_text(
            (40, 40),
            text,
            fill="black",
        )

        image.save(output_path)

        return output_path

    async def agenerate(
        self,
        prompt: str,
        output_path: Path,
    ) -> Path:

        return self.generate(
            prompt,
            output_path,
        )