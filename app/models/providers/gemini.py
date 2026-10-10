import httpx
from typing import Any

from app.models.base import BaseProvider
from app.models.config import settings
from app.services.admin_settings_service import provider_api_key


class GeminiTextResponse:
    """Wrapper that exposes .text for ModelResponse.content compatibility."""
    def __init__(self, text: str):
        self.text = text


class GeminiProvider(BaseProvider):

    def __init__(self, model: str):
        self.api_key = provider_api_key("text", "gemini")
        raw_model = (model or "").strip().lower()
        if not raw_model or raw_model in ("default_chat", "fast_chat", "default", "none"):
            self.model = "gemini-3.8-flash"
        elif raw_model == "reasoning":
            self.model = "gemini-1.5-pro"
        else:
            self.model = model
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    def _convert_messages(self, messages: list[dict[str, Any]]) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
        system_instruction = None
        contents = []

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "system":
                system_instruction = {"parts": [{"text": str(content)}]}
            elif role == "assistant":
                contents.append({"role": "model", "parts": [{"text": str(content)}]})
            else:
                contents.append({"role": "user", "parts": [{"text": str(content)}]})

        if not contents and system_instruction:
            contents.append({"role": "user", "parts": [{"text": "Proceed."}]})

        return system_instruction, contents

    def invoke(self, messages):
        system_instruction, contents = self._convert_messages(messages)
        models_to_try = [self.model]

        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": settings.TEMPERATURE,
                "maxOutputTokens": settings.MAX_TOKENS,
            },
        }
        if system_instruction:
            payload["system_instruction"] = system_instruction

        last_err_msg = ""
        with httpx.Client(timeout=60.0) as client:
            for m in dict.fromkeys(models_to_try):
                url = f"{self.base_url}/{m}:generateContent?key={self.api_key}"
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    try:
                        candidate = data["candidates"][0]
                        text = candidate["content"]["parts"][0]["text"]
                        return GeminiTextResponse(text=text)
                    except (KeyError, IndexError) as err:
                        raise ValueError(f"Unexpected Gemini response structure: {data}") from err
                last_err_msg = f"Gemini API error ({resp.status_code}): {resp.text}"

        raise ValueError(last_err_msg)

    async def ainvoke(self, messages):
        system_instruction, contents = self._convert_messages(messages)
        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"

        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": settings.TEMPERATURE,
                "maxOutputTokens": settings.MAX_TOKENS,
            },
        }
        if system_instruction:
            payload["system_instruction"] = system_instruction

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                raise ValueError(f"Gemini API error ({resp.status_code}): {resp.text}")
            data = resp.json()

        try:
            candidate = data["candidates"][0]
            text = candidate["content"]["parts"][0]["text"]
            return GeminiTextResponse(text=text)
        except (KeyError, IndexError) as err:
            raise ValueError(f"Unexpected Gemini response structure: {data}") from err

    def stream(self, messages):
        raise NotImplementedError
