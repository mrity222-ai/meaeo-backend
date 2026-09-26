from pydantic import BaseModel


class AdvertisingStrategy(BaseModel):
    platform: str
    ad_format: list[str]
    budget: str
    advertising_goals: list[str]
    targeting_criteria: list[str]