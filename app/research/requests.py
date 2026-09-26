from pydantic import BaseModel


class CrawlRequest(BaseModel):

    website: str
    brand_name: str
    max_pages: int = 25
    include_blog: bool = True
    include_faq: bool = True
    include_pricing: bool = True

class IndustrySearchRequest(BaseModel):

    query: str
    max_results: int = 5

class TrendRequest(BaseModel):

    keyword: str
    region: str = "global"