import os
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

        configured = os.getenv(
            "RESEARCH_PROVIDERS",
            "tavily",
        )

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