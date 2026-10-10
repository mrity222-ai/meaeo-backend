import asyncio
from datetime import date
from types import SimpleNamespace

import httpx
import pytest

from test_google_business_security import system
from test_google_business_results import service
from app.analytics.providers.live import LiveAnalyticsProvider
from app.repositories.analytics_repository import AnalyticsRepository
from app.storage.json_storage import JsonStorage


def test_google_daily_values_zero_and_incomplete_range(system):
    payload = {"multiDailyMetricTimeSeries": [{"dailyMetricTimeSeries": [
        {"dailyMetric": "CALL_CLICKS", "timeSeries": {"datedValues": [
            {"date": {"year": 2026, "month": 10, "day": 1}, "value": "0"},
            {"date": {"year": 2026, "month": 10, "day": 2}, "value": "2"}]}},
        {"dailyMetric": "WEBSITE_CLICKS", "timeSeries": {"datedValues": [
            {"date": {"year": 2026, "month": 10, "day": 1}, "value": "5"}]}}
    ]}]}
    def handler(request):
        assert request.url.path == '/v1/locations/1:fetchMultiDailyMetricsTimeSeries'
        assert request.url.params['dailyRange.startDate.day'] == '1'
        assert 'CALL_CLICKS' in request.url.params.get_list('dailyMetrics')
        return httpx.Response(200, json=payload)
    srv, client = service(handler=handler)
    async def run():
        try:
            result = await srv.fetch_performance(system[0], 't1', date(2026,10,1), date(2026,10,2))
            assert result['metrics']['CALL_CLICKS'] == 2
            assert result['daily'][0]['metrics']['CALL_CLICKS'] == 0
            assert result['metrics']['WEBSITE_CLICKS'] is None
            assert result['data_source'] == 'platform_api' and result['availability'] == 'partial'
        finally: await client.aclose()
    asyncio.run(run())


@pytest.mark.parametrize('status,message', [(403,'permissions'), (429,'rate limit'), (401,'expired'), (500,'failed')])
def test_google_failure_not_zero(system, status, message):
    srv, client = service(handler=lambda request: httpx.Response(status, json={}))
    async def run():
        try:
            result = await srv.fetch_performance(system[0], 't1', date(2026,10,1), date(2026,10,2))
            assert result['last_updated'] is None and result['metrics'] == {}
            assert message in result['unavailable_reason']
        finally: await client.aclose()
    asyncio.run(run())


def test_google_foreign_location_rejected_without_http(system):
    srv, client = service(handler=lambda request: pytest.fail('must not request foreign location'))
    async def run():
        from fastapi import HTTPException
        try:
            with pytest.raises(HTTPException) as error:
                await srv.fetch_performance(system[0], 't1', date(2026,10,1), date(2026,10,2), 'accounts/1/locations/2')
            assert error.value.status_code == 404
        finally: await client.aclose()
    asyncio.run(run())


def test_linkedin_exact_post_organic_statistics(monkeypatch):
    provider = LiveAnalyticsProvider()
    provider._channel = SimpleNamespace(external_account_id='urn:li:organization:10')
    post = SimpleNamespace(external_id='urn:li:share:20')
    credential = SimpleNamespace(access_token='test', scope='rw_organization_admin')
    def get(url, **kwargs):
        assert kwargs['params']['shares'] == 'List(urn:li:share:20)'
        assert kwargs['headers']['LinkedIn-Version'] == '202609'
        return httpx.Response(200, request=httpx.Request('GET',url), json={'elements': [
            {'organizationalEntity':'urn:li:organization:10','share':'urn:li:share:20',
             'totalShareStatistics': {'impressionCount':100,'clickCount':0,'likeCount':3,'engagement':0.03}}
        ]})
    monkeypatch.setattr(httpx,'get',get)
    metrics, errors = provider._fetch_linkedin(post,credential)
    assert metrics == {'impressions':100,'clicks':0,'likes':3,'engagement_rate':0.03}
    assert 'Organic lifetime' in errors[0]


@pytest.mark.parametrize('organization,scope', [('urn:li:person:1','rw_organization_admin'), ('urn:li:organization:1','w_member_social')])
def test_linkedin_permission_profile_fail_closed(monkeypatch,organization,scope):
    monkeypatch.setattr(httpx,'get',lambda *args,**kwargs:pytest.fail('must not fetch'))
    provider=LiveAnalyticsProvider(); provider._channel=SimpleNamespace(external_account_id=organization)
    metrics, errors=provider._fetch_linkedin(SimpleNamespace(external_id='urn:li:share:20'),SimpleNamespace(scope=scope))
    assert metrics == {} and errors


def test_profile_storage_isolated_idempotent_and_preserves_verified_on_failure(tmp_path):
    repo=AnalyticsRepository(JsonStorage()); repo.ROOT=tmp_path
    result={'business_account_id':1,'channel_id':1,'start_date':'2026-10-01','end_date':'2026-10-02',
            'data_source':'platform_api','last_updated':'2026-10-03T00:00:00Z','metrics':{'CALL_CLICKS':0}}
    path=repo.save_profile_performance('t1',1,result)
    assert repo.save_profile_performance('t1',1,result)==path
    assert repo.save_profile_performance('t2',1,result)!=path
    failed={**result,'data_source':'unavailable','last_updated':None,'metrics':{}}
    assert repo.save_profile_performance('t1',1,failed)!=path
    assert repo.storage.load(path)['metrics']['CALL_CLICKS']==0
    with pytest.raises(ValueError):repo.save_profile_performance('t1',2,result)


def test_google_route_rejects_unowned_business(system):
    response=system[1].get('/google-business/performance?business_account_id=3&start_date=2026-10-01&end_date=2026-10-02',headers={'X-Tenant-ID':'t1'})
    assert response.status_code==404


def test_linkedin_ugc_query_and_foreign_response(monkeypatch):
    provider=LiveAnalyticsProvider(); provider._channel=SimpleNamespace(external_account_id='urn:li:organization:10')
    def get(url,**kwargs):
        assert kwargs['params']['ugcPosts[0]']=='urn:li:ugcPost:20'
        return httpx.Response(200,request=httpx.Request('GET',url),json={'elements':[
            {'organizationalEntity':'urn:li:organization:999','ugcPost':'urn:li:ugcPost:20','totalShareStatistics':{'clickCount':123}}
        ]})
    monkeypatch.setattr(httpx,'get',get)
    metrics, errors=provider._fetch_linkedin(SimpleNamespace(external_id='urn:li:ugcPost:20'),SimpleNamespace(access_token='test',scope='rw_organization_admin'))
    assert metrics=={} and errors


def test_background_sync_schedule_and_disable(monkeypatch):
    from app.workers.tasks import sync_analytics_task
    from app.workers.celery_app import celery_app
    from app.models.config import settings
    assert celery_app.conf.beat_schedule['sync-platform-analytics-every-six-hours']['schedule']==21600
    monkeypatch.setattr(settings,'ANALYTICS_SYNC_ENABLED',False)
    assert sync_analytics_task.run()=={'status':'disabled'}


def test_background_sync_scopes_channels_and_continues_failure(monkeypatch):
    from app.workers import tasks
    from app.api import analytics
    from app.services import google_reviews_service
    from app.models.config import settings
    campaign=SimpleNamespace(id=1,business_account_id=7,tenant_id='t7')
    channels=[SimpleNamespace(id=7,business_account_id=7,tenant_id='t7',external_account_id='locations/7'),
              SimpleNamespace(id=8,business_account_id=8,tenant_id='t8',external_account_id='locations/8')]
    class DB:
        def __init__(self):self.results=iter([[campaign],channels]);self.rollbacks=0
        def __enter__(self):return self
        def __exit__(self,*args):pass
        def scalars(self,*args):return SimpleNamespace(all=lambda:next(self.results))
        def rollback(self):self.rollbacks+=1
    db=DB();monkeypatch.setattr(tasks,'SessionLocal',lambda:db)
    monkeypatch.setattr(settings,'ANALYTICS_SYNC_ENABLED',True)
    def collect(cid,bid,tenant,session):
        assert (cid,bid,tenant.tenant_id)==(1,7,'t7')
        return SimpleNamespace(last_updated=True)
    monkeypatch.setattr(analytics,'get_campaign_analytics',collect)
    saved=[]
    monkeypatch.setattr(AnalyticsRepository,'save_profile_performance',lambda self,tenant,bid,result:saved.append((tenant,bid)))
    class Service:
        def __init__(self,business_account_id):self.bid=business_account_id
        async def fetch_performance(self,session,tenant,start,end,location):
            assert tenant==f't{self.bid}' and location==f'locations/{self.bid}'
            if self.bid==7:raise httpx.ReadTimeout('test')
            return {'last_updated':True}
    monkeypatch.setattr(google_reviews_service,'GoogleBusinessService',Service)
    result=tasks.sync_analytics_task.run()
    assert result=={'status':'partial','campaigns':1,'profiles':1,'unavailable':1}
    assert saved==[('t7',7),('t8',8)] and db.rollbacks==1
