from io import BytesIO
from pathlib import Path
from PIL import Image
from google import genai

from app.image.base import BaseImageProvider
from app.image.schemas import GeneratedImageResult
from app.models.config import settings
from app.services.admin_settings_service import provider_api_key


class GeminiImageProvider(BaseImageProvider):

    @property
    def provider_name(self) -> str:
        return "gemini"

    def _get_api_key(self) -> str:
        return provider_api_key("image", "gemini")

    def generate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:
        try:
            api_key = self._get_api_key()
            if not api_key:
                raise ValueError("GEMINI_API_KEY is not configured.")

            client = genai.Client(api_key=api_key)

            model_name = getattr(settings, "IMAGE_MODEL", "imagen-3.0-generate-002")
            if not model_name or "flux" in model_name.lower() or "schnell" in model_name.lower():
                model_name = "imagen-3.0-generate-002"

            result = client.models.generate_images(
                model=model_name,
                prompt=prompt,
                config=dict(
                    number_of_images=1,
                    output_mime_type="image/jpeg",
                    aspect_ratio="1:1",
                ),
            )

            if not result.generated_images:
                raise ValueError("No generated images returned from Gemini Imagen API.")

            output_path.parent.mkdir(parents=True, exist_ok=True)
            for generated_image in result.generated_images:
                img = Image.open(BytesIO(generated_image.image.image_bytes))
                img.save(output_path, "JPEG")
                break

            return GeneratedImageResult(
                image_path=output_path,
                provider=self.provider_name,
                prompt=prompt,
            )
        except Exception:
            # Demo output must be explicitly selected through IMAGE_MODEL_PROVIDER=mock.
            raise RuntimeError("Gemini image generation failed. Check provider configuration and retry.") from None

    async def agenerate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:
        import asyncio
        return await asyncio.to_thread(self.generate, prompt, output_path)