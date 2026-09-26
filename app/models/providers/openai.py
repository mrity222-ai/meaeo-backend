from openai import AsyncOpenAI, OpenAI

from app.models.base import BaseProvider
from app.models.config import settings


class OpenAIProvider(BaseProvider):

    def __init__(self, model: str):
        api_key = (
            settings.OPENAI_API_KEY.get_secret_value()
            if hasattr(settings.OPENAI_API_KEY, "get_secret_value")
            else str(settings.OPENAI_API_KEY or "")
        )

        self.client = OpenAI(api_key=api_key)
        self.async_client = AsyncOpenAI(api_key=api_key)
        self.model = model or "gpt-4o-mini"

    def invoke(self, messages):
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
        )
        return response

    async def ainvoke(self, messages):
        response = await self.async_client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
        )
        return response

    def stream(self, messages):
        raise NotImplementedError
