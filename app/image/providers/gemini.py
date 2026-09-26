import base64
from pathlib import Path
import httpx

from app.image.base import BaseImageProvider
from app.image.schemas import GeneratedImageResult
from app.models.config import settings


class GeminiImageProvider(BaseImageProvider):

    @property
    def provider_name(self) -> str:
        return "gemini"

    def _get_api_key(self) -> str:
        return (
            settings.GEMINI_API_KEY.get_secret_value()
            if hasattr(settings.GEMINI_API_KEY, "get_secret_value")
            else str(settings.GEMINI_API_KEY or "")
        )

    def generate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:
        try:
            api_key = self._get_api_key()
            if not api_key:
                raise ValueError("GEMINI_API_KEY is not configured.")

            url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={api_key}"
            payload = {
                "instances": [{"prompt": prompt}],
                "parameters": {
                    "sampleCount": 1,
                    "aspectRatio": "1:1",
                    "outputOptions": {"mimeType": "image/jpeg"},
                },
            }

            with httpx.Client(timeout=60.0) as client:
                resp = client.post(url, json=payload)
                if resp.status_code != 200:
                    raise ValueError(f"Gemini Imagen API error ({resp.status_code}): {resp.text}")
                data = resp.json()

            b64_str = data["predictions"][0]["bytesBase64Encoded"]
            img_bytes = base64.b64decode(b64_str)

            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(img_bytes)

            return GeneratedImageResult(
                image_path=output_path,
                provider=self.provider_name,
                prompt=prompt,
            )
        except Exception as e:
            print(f"[GeminiImageProvider] Generation failed: {e}. Falling back to mock.")
            from app.image.providers.mock import MockImageProvider
            return MockImageProvider().generate(prompt, output_path)

    async def agenerate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:
        import asyncio
        return await asyncio.to_thread(self.generate, prompt, output_path)