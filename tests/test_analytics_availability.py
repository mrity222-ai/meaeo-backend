from types import SimpleNamespace
from datetime import datetime, timezone
import httpx
import pytest
from sqlalchemy import select
from test_daily_posting import system
from app.workers.campaign_scheduler import CampaignScheduler
from app.database.models import CampaignPostPublication
from app.schemas.credentials import OAuthCredential
from app.schemas.publishing import PublishedPost, PublishingResult
from app.analytics.providers.live import LiveAnalyticsProvider
from app.analytics.aggregator import AnalyticsAggregator
from app.analytics.schemas import PostAnalytics


def publishing():
    return PublishingResult(posts=[PublishedPost(platform=platform, day=1, title='Post',status='published',
        external_id=platform+'123',image_path='image.png') for platform in ['facebook','instagram']])


def credentials(tenant='t1',business=1):
    calls=[]
    def get(context,bid,cid):
        calls.append((context.tenant_id,bid,cid))
        return OAuthCredential(tenant_id=tenant,business_account_id=business,business_channel_id=cid,
            platform='facebook' if cid==1 else 'instagram',access_token='instagram-token',
            metadata={'facebook_page_access_token':'facebook-token'})
    return SimpleNamespace(get_for_channel=get),calls


def test_owned_credentials_and_real_zero(system,monkeypatch):
    CampaignScheduler().process_single_post(1)
    service,calls=credentials()
    requests=[]
    def get(url,headers,params,timeout):
        requests.append((url,headers,params))
        if 'facebook123' in url:
            assert headers['Authorization']=='Bearer facebook-token'
            body={'likes':{'summary':{'total_count':0}},'comments':{'summary':{'total_count':0}},'shares':{'count':0}}
        elif 'metric' in params:
            assert headers['Authorization']=='Bearer instagram-token'
            body={'data':[{'name':params['metric'],'values':[{'value':0}]}]}
        else:
            body={'like_count':0,'comments_count':0}
        return httpx.Response(200,json=body,request=httpx.Request('GET',url))
    monkeypatch.setattr(httpx,'get',get)
    with system[0]() as db:
        result=LiveAnalyticsProvider('t1',db,service).collect('Test',publishing())
    assert result.success
    facebook,instagram=result.posts
    assert facebook.likes==0 and facebook.reach is None
    assert instagram.reach==0 and instagram.saves==0
    assert instagram.clicks is None and instagram.conversions is None
    assert instagram.last_updated is not None
    assert calls==[('t1',1,1),('t1',1,2)]
    assert not any('post_engaged_users' in str(params) for _,_,params in requests)


def test_api_failure_is_null_not_zero(system,monkeypatch):
    CampaignScheduler().process_single_post(1)
    service,_=credentials()
    def get(*args,**kwargs): raise httpx.ReadTimeout('offline')
    monkeypatch.setattr(httpx,'get',get)
    with system[0]() as db:
        result=LiveAnalyticsProvider('t1',db,service).collect('Test',publishing())
    assert not result.success
    assert all(post.reach is None and post.likes is None and post.last_updated is None for post in result.posts)


@pytest.mark.parametrize('tenant,business',[('other',1),('t1',2)])
def test_wrong_credential_scope_never_requests(system,monkeypatch,tenant,business):
    CampaignScheduler().process_single_post(1)
    service,_=credentials(tenant,business)
    monkeypatch.setattr(httpx,'get',lambda *a,**kw:pytest.fail('Wrong account request'))
    with system[0]() as db:
        result=LiveAnalyticsProvider('t1',db,service).collect('Test',publishing())
    assert not result.success


def test_global_token_not_used_without_tenant(monkeypatch):
    monkeypatch.setenv('META_PAGE_ACCESS_TOKEN','global-token')
    monkeypatch.setattr(httpx,'get',lambda *a,**kw:pytest.fail('Global token used'))
    result=LiveAnalyticsProvider().collect('Test',publishing())
    assert not result.success and all(post.reach is None for post in result.posts)


def test_scheduled_posts_not_collected():
    result=publishing()
    for post in result.posts: post.status='scheduled'
    assert LiveAnalyticsProvider().collect('Test',result).posts==[]


def test_aggregate_unknown_and_zero():
    zero=PostAnalytics(campaign_name='Test',platform='instagram',external_post_id='1',reach=0,clicks=0)
    result=AnalyticsAggregator.aggregate('Test',[zero])
    assert result.total_reach==0 and result.total_clicks==0
    assert result.total_impressions is None and result.engagement_rate is None
    unknown=PostAnalytics(campaign_name='Test',platform='facebook',external_post_id='2')
    assert AnalyticsAggregator.aggregate('Test',[zero,unknown]).total_reach is None
    assert AnalyticsAggregator.aggregate('Test',[]).total_reach is None


def test_empty_analytics_api_returns_unavailable(system):
    from app.api.analytics import get_campaign_analytics
    from app.security.tenant import TenantContext
    with system[0]() as db:
        result=get_campaign_analytics(1,1,TenantContext('t1'),db)
    assert result.availability=='unavailable' and result.total_reach is None


def test_cross_tenant_api_rejected(system):
    from app.api.analytics import get_campaign_analytics
    from app.security.tenant import TenantContext
    from fastapi import HTTPException
    with system[0]() as db, pytest.raises(HTTPException) as error:
        get_campaign_analytics(1,1,TenantContext('other'),db)
    assert error.value.status_code==404
