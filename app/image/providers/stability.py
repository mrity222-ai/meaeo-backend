from pathlib import Path
import httpx

from app.image.base import BaseImageProvider
from app.image.schemas import GeneratedImageResult
from app.models.config import settings
from app.services.admin_settings_service import provider_api_key


class StabilityImageProvider(BaseImageProvider):

    @property
    def provider_name(self) -> str:
        return "stability"

    def _get_api_key(self) -> str:
        return provider_api_key("image", "stability")

    def generate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:
        try:
            api_key = self._get_api_key()
            if not api_key:
                raise ValueError("STABILITY_API_KEY is not configured.")

            url = "https://api.stability.ai/v2beta/stable-image/generate/core"
            headers = {
                "authorization": f"Bearer {api_key}",
                "accept": "image/*",
            }
            data = {
                "prompt": prompt,
                "output_format": "png",
            }

            with httpx.Client(timeout=60.0) as client:
                resp = client.post(url, headers=headers, data=data)
                if resp.status_code != 200:
                    raise ValueError(f"Stability AI API error ({resp.status_code}): {resp.text}")
                img_bytes = resp.content

            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(img_bytes)

            return GeneratedImageResult(
                image_path=output_path,
                provider=self.provider_name,
                prompt=prompt,
            )
        except Exception:
            raise RuntimeError("Stability image generation failed. Check provider configuration and retry.") from None

    async def agenerate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:
        import asyncio
        return await asyncio.to_thread(self.generate, prompt, output_path)
