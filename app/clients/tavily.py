from typing import Any

from app.clients.base import BaseClient
from app.models.config import settings


class TavilyClient(BaseClient):

    BASE_URL = "https://api.tavily.com"

    @property
    def headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
        }

    def search(
        self,
        query: str,
        *,
        max_results: int = 5,
    ) -> dict[str, Any]:

        payload = {
            "api_key": settings.TAVILY_API_KEY.get_secret_value(),
            "query": query,
            "max_results": max_results,
            "include_answer": True,
            "include_raw_content": False,
        }

        return self.post(
            "/search",
            json=payload,
        )

    async def asearch(
        self,
        query: str,
        *,
        max_results: int = 5,
    ) -> dict[str, Any]:

        payload = {
            "api_key": settings.TAVILY_API_KEY.get_secret_value(),
            "query": query,
            "max_results": max_results,
            "include_answer": True,
            "include_raw_content": False,
        }

        return await self.apost(
            "/search",
            json=payload,
        )