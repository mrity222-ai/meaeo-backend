from huggingface_hub import (
    AsyncInferenceClient,
    InferenceClient,
)

from app.models.base import BaseProvider
from app.models.config import settings
from app.services.admin_settings_service import provider_api_key


class HuggingFaceProvider(BaseProvider):

    def __init__(self, model: str):

        hf_token = provider_api_key("text", "huggingface")

        self.client = InferenceClient(
            api_key=hf_token
        )

        self.async_client = AsyncInferenceClient(
            api_key=hf_token
        )

        self.model = model

    def invoke(self, messages):

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
        )

        return response

    async def ainvoke(self, messages):

        response = await (
            self.async_client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=settings.TEMPERATURE,
                max_tokens=settings.MAX_TOKENS,
            )
        )

        return response

    def stream(self, messages):

        raise NotImplementedError