import os
from app.models.config import settings, runtime_settings
from typing import ClassVar

from app.clients.dataforseo import DataForSEOClient
from app.clients.firecrawl import FirecrawlClient
from app.clients.tavily import TavilyClient
from app.research.cache import ResearchCache
from app.research.parsers.dataforseo import DataForSEOParser
from app.research.parsers.firecrawl import FirecrawlParser
from app.research.providers.firecrawl import (
    FirecrawlProvider,
)
from app.research.providers.mock import (
    MockResearchProvider,
)
from app.research.providers.seo import (
    SEOProvider,
)
from app.research.providers.tavily import (
    TavilyProvider,
)


class ResearchRegistry:

    _providers: ClassVar[dict] = {}

    @classmethod
    def selected_names(cls):
        names = [name.strip().lower() for name in settings.RESEARCH_PROVIDERS.split(",") if name.strip()]
        for name, key in (("tavily", "TAVILY_ENABLED"), ("firecrawl", "FIRECRAWL_ENABLED"), ("seo", "SEO_ENABLED")):
            enabled = getattr(settings, key)
            if enabled is True and name not in names:
                names.append(name)
            elif enabled is False:
                names = [item for item in names if item != name]
        if settings.APP_ENV.lower() in {"production", "prod"} and "mock" in names:
            raise ValueError("Mock research is disabled in production.")
        return names

    @classmethod
    def scoped_providers(cls):
        available = cls._build_providers()
        selected = cls.selected_names()
        if any(name not in available for name in selected):
            raise ValueError("Unknown research provider in configuration.")
        return {name: available[name] for name in selected}

    @classmethod
    def _build_providers(cls):

        return {
            "mock": MockResearchProvider(),

            "firecrawl": FirecrawlProvider(
                client=FirecrawlClient(),
                parser=FirecrawlParser(),
                cache=ResearchCache(
                    "business"
                ),
            ),

            "tavily": TavilyProvider(
                client=TavilyClient(),
            ),

            "seo": SEOProvider(
                client=DataForSEOClient(),
                parser=DataForSEOParser(),
            ),
        }

    @classmethod
    def initialize(cls):

        configured = ",".join(cls.selected_names())

        names = [
            name.strip().lower()
            for name in configured.split(",")
            if name.strip()
        ]

        available = cls._build_providers()

        cls._providers = {}

        for name in names:

            provider = available.get(name)

            if provider is None:
                raise ValueError(
                    f"Unknown research provider: {name}"
                )

            cls._providers[name] = provider

    @classmethod
    def get(
        cls,
        provider_name: str,
    ):

        if runtime_settings.get() is not None:
            provider = cls.scoped_providers().get(provider_name.lower())
            if provider is None:
                raise ValueError("Research provider is disabled or unknown.")
            return provider
        if not cls._providers:
            cls.initialize()

        provider = cls._providers.get(
            provider_name.lower()
        )

        if provider is None:
            raise ValueError(
                f"Unknown provider: {provider_name}"
            )

        return provider

    @classmethod
    def providers(cls):

        if runtime_settings.get() is not None:
            return list(cls.scoped_providers().values())
        if not cls._providers:
            cls.initialize()

        return list(
            cls._providers.values()
        )

    @classmethod
    def register(
        cls,
        name: str,
        provider,
    ):

        cls._providers[
            name.lower()
        ] = provider
