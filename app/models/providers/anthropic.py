import httpx
from typing import Any

from app.models.base import BaseProvider
from app.models.config import settings
from app.services.admin_settings_service import provider_api_key


class AnthropicTextResponse:
    """Wrapper that exposes .text for ModelResponse.content compatibility."""
    def __init__(self, text: str):
        self.text = text


class AnthropicProvider(BaseProvider):

    def __init__(self, model: str):
        self.api_key = provider_api_key("text", "anthropic")
        self.model = model or "claude-3-5-sonnet-20241022"
        self.base_url = "https://api.anthropic.com/v1/messages"

    def _convert_messages(self, messages: list[dict[str, Any]]) -> tuple[str | None, list[dict[str, Any]]]:
        system_prompt = None
        formatted_messages = []

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "system":
                system_prompt = str(content)
            elif role in ("assistant", "user"):
                formatted_messages.append({"role": role, "content": str(content)})
            else:
                formatted_messages.append({"role": "user", "content": str(content)})

        if not formatted_messages:
            formatted_messages.append({"role": "user", "content": "Please proceed."})

        return system_prompt, formatted_messages

    def _get_headers(self) -> dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

    def invoke(self, messages):
        system_prompt, formatted_messages = self._convert_messages(messages)
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": formatted_messages,
            "max_tokens": settings.MAX_TOKENS,
            "temperature": settings.TEMPERATURE,
        }
        if system_prompt:
            payload["system"] = system_prompt

        with httpx.Client(timeout=60.0) as client:
            resp = client.post(self.base_url, headers=self._get_headers(), json=payload)
            if resp.status_code != 200:
                raise ValueError(f"Anthropic API error ({resp.status_code}): {resp.text}")
            data = resp.json()

        try:
            text = data["content"][0]["text"]
            return AnthropicTextResponse(text=text)
        except (KeyError, IndexError) as err:
            raise ValueError(f"Unexpected Anthropic response structure: {data}") from err

    async def ainvoke(self, messages):
        system_prompt, formatted_messages = self._convert_messages(messages)
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": formatted_messages,
            "max_tokens": settings.MAX_TOKENS,
            "temperature": settings.TEMPERATURE,
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(self.base_url, headers=self._get_headers(), json=payload)
            if resp.status_code != 200:
                raise ValueError(f"Anthropic API error ({resp.status_code}): {resp.text}")
            data = resp.json()

        try:
            text = data["content"][0]["text"]
            return AnthropicTextResponse(text=text)
        except (KeyError, IndexError) as err:
            raise ValueError(f"Unexpected Anthropic response structure: {data}") from err

    def stream(self, messages):
        raise NotImplementedError
