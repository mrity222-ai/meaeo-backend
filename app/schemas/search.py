from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


class SearchRequest(BaseModel):
    """
    Request object for all search providers.
    """

    query: str = Field(
        ...,
        description="Search query."
    )

    max_results: int = Field(
        default=10,
        ge=1,
        le=20,
        description="Maximum number of results."
    )

    language: str = Field(
        default="en",
        description="Language of search results."
    )

    region: str | None = Field(
        default=None,
        description="Geographic region."
    )

    freshness: Literal[
        "day",
        "week",
        "month",
        "year",
        "all"
    ] = Field(
        default="all",
        description="Freshness filter."
    )




class SearchResult(BaseModel):
    """
    Represents a single search result.
    """
    title: str
    url: HttpUrl
    snippet: str
    source: str | None = None
    published_date: str | None = None

class SearchResponse(BaseModel):
    """
    Standardized search response.
    """

    query: str
    provider: str
    results: list[SearchResult]