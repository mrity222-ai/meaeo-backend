from pathlib import Path

from huggingface_hub import InferenceClient

from app.models.config import settings
from app.models.image.base import BaseImageProvider


class HuggingFaceImageProvider(BaseImageProvider):

    def __init__(self, model: str):

        hf_token = (
            settings.HF_TOKEN.get_secret_value()
            if hasattr(settings.HF_TOKEN, "get_secret_value")
            else str(settings.HF_TOKEN)
        )

        self.client = InferenceClient(
            api_key=hf_token
        )

        # self.model = settings.IMAGE_MODEL
        self.model = model


    def generate(
        self,
        prompt: str,
        output_path: Path
    ) -> Path:

        image = self.client.text_to_image(
            prompt=prompt,
            model=self.model,
        )

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        image.save(output_path)

        return output_path

    async def agenerate(
        self,
        prompt: str,
        output_path: Path
    ) -> Path:

        return self.generate(
            prompt,
            output_path
        )