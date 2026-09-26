from app.clients.http import HttpClient
from app.models.config import settings


class TavilyClient:

    BASE_URL = "https://api.tavily.com/search"

    def search(
        self,
        query: str,
        *,
        max_results: int = 5,
    ) -> dict:

        payload = {
            "api_key": settings.TAVILY_API_KEY,
            "query": query,
            "max_results": max_results,
            "search_depth": "advanced",
            "include_answer": False,
            "include_images": False,
            "include_raw_content": False,
        }

        return HttpClient.post(
            self.BASE_URL,
            json=payload,
        )