from typing import ClassVar

from app.models.providers.anthropic import AnthropicProvider
from app.models.providers.gemini import GeminiProvider
from app.models.providers.huggingface import HuggingFaceProvider
from app.models.providers.ollama import OllamaProvider
from app.models.providers.openai import OpenAIProvider


class ModelRegistry:

    PROVIDERS: ClassVar[dict] = {
        "huggingface": HuggingFaceProvider,
        "openai": OpenAIProvider,
        "gemini": GeminiProvider,
        "anthropic": AnthropicProvider,
        "ollama": OllamaProvider,
    }

    MODELS: ClassVar[dict] = {
        "huggingface": {
            "default_chat": "meta-llama/Llama-3.1-8B-Instruct",
            "fast_chat": "meta-llama/Llama-3.1-8B-Instruct",
            "reasoning": "meta-llama/Llama-3.1-8B-Instruct",
        },
        "openai": {
            "default_chat": "gpt-4o-mini",
            "fast_chat": "gpt-4o-mini",
            "reasoning": "gpt-4o",
            "gpt-4o": "gpt-4o",
            "gpt-4o-mini": "gpt-4o-mini",
        },
        "gemini": {
            "default_chat": "gemini-1.5-flash",
            "fast_chat": "gemini-1.5-flash",
            "reasoning": "gemini-1.5-pro",
            "gemini-1.5-flash": "gemini-1.5-flash",
            "gemini-1.5-pro": "gemini-1.5-pro",
            "gemini-2.0-flash": "gemini-2.0-flash",
        },
        "anthropic": {
            "default_chat": "claude-3-5-sonnet-20241022",
            "fast_chat": "claude-3-5-haiku-20241022",
            "reasoning": "claude-3-5-sonnet-20241022",
            "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku": "claude-3-5-haiku-20241022",
        },
        "ollama": {
            "default_chat": "qwen2.5:3b",
            "fast_chat": "qwen2.5:3b",
            "reasoning": "qwen2.5:7b",
        },
    }

    @classmethod
    def get_provider(cls, provider: str):
        provider_key = (provider or "huggingface").strip().lower()
        if provider_key not in cls.PROVIDERS:
            # Fallback to huggingface if unknown
            return cls.PROVIDERS.get("huggingface")
        return cls.PROVIDERS[provider_key]

    @classmethod
    def get_model(cls, provider: str, alias: str):
        provider_key = (provider or "huggingface").strip().lower()
        alias_key = (alias or "default_chat").strip()

        provider_models = cls.MODELS.get(provider_key, {})
        if alias_key in provider_models:
            return provider_models[alias_key]

        # If user passed a specific model name directly (e.g. "gpt-4o" or custom model)
        if alias_key and alias_key != "default_chat":
            return alias_key

        return provider_models.get("default_chat", "meta-llama/Llama-3.1-8B-Instruct")