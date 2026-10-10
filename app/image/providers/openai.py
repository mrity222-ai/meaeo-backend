import base64
from pathlib import Path
from openai import OpenAI

from app.image.base import BaseImageProvider
from app.image.schemas import GeneratedImageResult
from app.models.config import settings
from app.services.admin_settings_service import provider_api_key


class OpenAIImageProvider(BaseImageProvider):

    @property
    def provider_name(self) -> str:
        return "openai"

    def _get_client(self) -> OpenAI:
        api_key = provider_api_key("image", "openai")
        return OpenAI(api_key=api_key)

    def generate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:
        try:
            client = self._get_client()
            model = getattr(settings, "IMAGE_MODEL", "dall-e-3")
            if not model or "flux" in model.lower():
                model = "dall-e-3"

            response = client.images.generate(
                model=model,
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                response_format="b64_json",
                n=1,
            )

            b64_data = response.data[0].b64_json
            image_bytes = base64.b64decode(b64_data)

            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(image_bytes)

            return GeneratedImageResult(
                image_path=output_path,
                provider=self.provider_name,
                prompt=prompt,
            )
        except Exception:
            raise RuntimeError("OpenAI image generation failed. Check provider configuration and retry.") from None

    async def agenerate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:
        import asyncio
        return await asyncio.to_thread(self.generate, prompt, output_path)
