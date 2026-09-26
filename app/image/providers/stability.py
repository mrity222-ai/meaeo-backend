from pathlib import Path
import httpx

from app.image.base import BaseImageProvider
from app.image.schemas import GeneratedImageResult
from app.models.config import settings


class StabilityImageProvider(BaseImageProvider):

    @property
    def provider_name(self) -> str:
        return "stability"

    def _get_api_key(self) -> str:
        return (
            settings.STABILITY_API_KEY.get_secret_value()
            if hasattr(settings.STABILITY_API_KEY, "get_secret_value")
            else str(settings.STABILITY_API_KEY or "")
        )

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
        except Exception as e:
            print(f"[StabilityImageProvider] Generation failed: {e}. Falling back to mock.")
            from app.image.providers.mock import MockImageProvider
            return MockImageProvider().generate(prompt, output_path)

    async def agenerate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:
        import asyncio
        return await asyncio.to_thread(self.generate, prompt, output_path)
