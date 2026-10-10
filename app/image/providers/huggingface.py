from pathlib import Path

from huggingface_hub import InferenceClient

from app.image.base import BaseImageProvider
from app.image.schemas import GeneratedImageResult
from app.models.config import settings
from app.services.admin_settings_service import provider_api_key


class HuggingFaceImageProvider(BaseImageProvider):

    @property
    def provider_name(self) -> str:
        return "huggingface"

    def generate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:

        try:
            model = getattr(settings, "IMAGE_MODEL", "black-forest-labs/FLUX.1-schnell")
            if not model or " " in model or "gemini" in model.lower():
                model = "black-forest-labs/FLUX.1-schnell"

            image = InferenceClient(
                api_key=provider_api_key("image", "huggingface"),
            ).text_to_image(
                prompt=prompt,
                model=model,
            )

            output_path.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            image.save(output_path)

            return GeneratedImageResult(
                image_path=output_path,
                provider=self.provider_name,
                prompt=prompt,
            )
        except Exception:
            raise RuntimeError("Hugging Face image generation failed. Check provider configuration and retry.") from None

    async def agenerate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:

        # The Hugging Face client call is synchronous.
        # Run it in a worker thread so async graph execution
        # does not block the event loop.
        import asyncio

        return await asyncio.to_thread(
            self.generate,
            prompt,
            output_path,
        )