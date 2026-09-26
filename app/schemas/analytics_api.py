from datetime import date

from app.analytics.schemas import CampaignAnalytics
from pydantic import BaseModel


class AnalyticsHistoryResponse(BaseModel):

    campaign_name: str

    start_date: date
    end_date: date

    snapshots: list[CampaignAnalytics]