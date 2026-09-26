from huggingface_hub import (
    AsyncInferenceClient,
    InferenceClient,
)

from app.models.base import BaseProvider
from app.models.config import settings


class HuggingFaceProvider(BaseProvider):

    def __init__(self, model: str):

        hf_token = (
            settings.HF_TOKEN.get_secret_value()
            if hasattr(settings.HF_TOKEN, "get_secret_value")
            else str(settings.HF_TOKEN)
        )

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