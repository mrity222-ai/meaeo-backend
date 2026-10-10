from datetime import date, datetime, timezone
from types import SimpleNamespace

import pytest
from sqlalchemy import select

from test_daily_posting import system
from test_analytics_availability import credentials, publishing
from app.workers.campaign_scheduler import CampaignScheduler
from app.analytics.providers.live import LiveAnalyticsProvider
from app.analytics.aggregator import AnalyticsAggregator
from app.analytics.schemas import CampaignAnalytics, PostAnalytics
from app.repositories.analytics_repository import AnalyticsRepository
from app.storage.json_storage import JsonStorage
from app.database.models import Campaign, CampaignPostPublication


def test_same_name_different_campaign_cannot_supply_credential(system,monkeypatch):
    CampaignScheduler().process_single_post(1)
    service,calls=credentials()
    with system[0]() as db:
        # Existing Test campaign is owned; a selected different ID must not borrow it.
        result=LiveAnalyticsProvider('t1',db,service,campaign_id=999,business_account_id=1).collect('Test',publishing())
    assert not result.success and calls==[]
    assert all(post.likes is None for post in result.posts)


def test_missing_external_id_remains_unavailable_in_reporting():
    result=publishing();result.posts[0].external_id=''
    collected=LiveAnalyticsProvider().collect('Test',result)
    assert len(collected.posts)==2
    assert all(post.last_updated is None and post.data_source=='unavailable' for post in collected.posts)


def test_partial_post_metrics_do_not_appear_completely_unavailable():
    timestamp=datetime.now(timezone.utc)
    known=PostAnalytics(campaign_name='Test',platform='instagram',external_post_id='1',likes=0,last_updated=timestamp,data_source='platform_api')
    unknown=PostAnalytics(campaign_name='Test',platform='linkedin',external_post_id='2')
    result=AnalyticsAggregator.aggregate('Test',[known,unknown])
    assert result.total_likes is None
    assert result.availability=='partial' and result.last_updated==timestamp


def test_verified_history_is_isolated_by_tenant_and_campaign_id(tmp_path):
    repo=AnalyticsRepository(JsonStorage());repo.ROOT=tmp_path
    timestamp=datetime.now(timezone.utc)
    snapshot=CampaignAnalytics(campaign_name='Same name',data_source='platform_api',last_updated=timestamp,total_reach=0)
    repo.save_verified('t1',1,snapshot)
    start=end=timestamp.date()
    result=repo.load_verified_range('t1',1,start,end)
    assert len(result)==1 and result[0].total_reach==0 and result[0].campaign_id==1
    assert repo.load_verified_range('t1',2,start,end)==[]
    assert repo.load_verified_range('t2',1,start,end)==[]


def test_unverified_history_is_not_presented_as_live_data(tmp_path):
    repo=AnalyticsRepository(JsonStorage());repo.ROOT=tmp_path
    legacy=CampaignAnalytics(campaign_name='Same',total_reach=99999)
    repo.save('t1',legacy)
    assert repo.load_verified_range('t1',1,date.today(),date.today())==[]
    with pytest.raises(ValueError):repo.save_verified('t1',1,legacy)


def test_analytics_endpoint_saves_only_actual_platform_data(system,tmp_path,monkeypatch):
    from app.api import analytics as api
    from app.security.tenant import TenantContext
    CampaignScheduler().process_single_post(1)
    service,_=credentials()
    monkeypatch.setattr(LiveAnalyticsProvider,'_fetch',lambda self,post,credential:({'likes':0,'comments':0,'shares':0},[]))
    original=LiveAnalyticsProvider
    monkeypatch.setattr(api,'LiveAnalyticsProvider',lambda **kwargs:original(credential_service=service,**kwargs))
    repo=AnalyticsRepository(JsonStorage());repo.ROOT=tmp_path
    monkeypatch.setattr(api,'AnalyticsRepository',lambda:repo)
    with system[0]() as db:
        result=api.get_campaign_analytics(1,1,TenantContext('t1'),db)
    assert result.data_source=='platform_api' and result.total_likes==0
    assert repo.load_verified_range('t1',1,result.last_updated.date(),result.last_updated.date())[0].campaign_id==1
