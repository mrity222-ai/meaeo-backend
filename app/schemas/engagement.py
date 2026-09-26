from pydantic import BaseModel


class EngagementStrategy(BaseModel):
    groups: str
    networking: str
    webinars: str