import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi import HTTPException
from sqlalchemy import select

from test_google_business_security import system
from app.database.models import GoogleBusinessPost, GoogleBusinessReview, BusinessChannel
from app.services.google_reviews_service import GoogleBusinessService
from app.schemas.google_business import GooglePostCreateRequest
from app.publishers.providers.google_business import GoogleBusinessPublisherProvider


def service(response=None,handler=None,token='test',short=False):
    metadata={'google_account_name':'accounts/1'} if short else {}
    credential=SimpleNamespace(tenant_id='t1',business_account_id=1,business_channel_id=1,platform='google_business',metadata=metadata,access_token=token)
    credentials=SimpleNamespace(get_valid_credential_for_channel=AsyncMock(return_value=credential if token else None))
    if handler is None:
        handler=lambda request:httpx.Response(200,json=response or {})
    client=httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return GoogleBusinessService(credential_service=credentials,http_client=client,business_account_id=1),client


@pytest.mark.parametrize('action',['post','reply','description'])
def test_no_credentials_never_claims_google_success(system,action):
    db,_=system;srv,client=service(token=None)
    async def run():
        try:
            with pytest.raises(HTTPException) as error:
                if action=='post':await srv.publish_local_post(db,'t1',GooglePostCreateRequest(summary='Offer'))
                elif action=='reply':await srv.send_reply_to_google(db,'t1',1,'Thanks')
                else:await srv.update_profile_description(db,'t1','accounts/1/locations/1','Shop')
            assert error.value.status_code==409
            assert db.get(GoogleBusinessReview,1).reply_status!='replied'
            assert len(db.scalars(select(GoogleBusinessPost)).all())==3
        finally:await client.aclose()
    asyncio.run(run())


@pytest.mark.parametrize('state,expected',[('LIVE','published'),('PROCESSING','processing'),('REJECTED','failed')])
def test_post_status_matches_google_state(system,state,expected):
    db,_=system
    def handler(request):
        assert str(request.url)=='https://mybusiness.googleapis.com/v4/accounts/1/locations/1/localPosts'
        return httpx.Response(200,json={'name':'accounts/1/locations/1/localPosts/123','state':state})
    srv,client=service(handler=handler)
    async def run():
        try:
            post=await srv.publish_local_post(db,'t1',GooglePostCreateRequest(summary='Offer'))
            assert post.status==expected
            assert (post.published_at is not None)==(expected=='published')
        finally:await client.aclose()
    asyncio.run(run())


@pytest.mark.parametrize('failure',['missing_id','timeout','http400','http500'])
def test_unconfirmed_post_is_never_published(system,failure):
    db,_=system
    def handler(request):
        if failure=='timeout':raise httpx.ReadTimeout('test',request=request)
        if failure.startswith('http'):return httpx.Response(int(failure[4:]),json={'error':'test'})
        return httpx.Response(200,json={})
    srv,client=service(handler=handler)
    async def run():
        try:
            post=await srv.publish_local_post(db,'t1',GooglePostCreateRequest(summary='Offer'))
            assert post.status==('failed' if failure=='http400' else 'reconciliation_required')
            assert post.published_at is None and post.error_message
        finally:await client.aclose()
    asyncio.run(run())


@pytest.mark.parametrize('success',[True,False])
def test_review_replied_only_after_google_confirmation(system,success):
    db,_=system;srv,client=service(response={'comment':'Thanks'} if success else {})
    async def run():
        try:
            if success:
                result=await srv.send_reply_to_google(db,'t1',1,'Thanks')
                assert result.reply_status=='replied' and result.replied_at is not None
            else:
                with pytest.raises(HTTPException):await srv.send_reply_to_google(db,'t1',1,'Thanks')
                assert db.get(GoogleBusinessReview,1).reply_status=='reconciliation_required'
                assert db.get(GoogleBusinessReview,1).replied_at is None
        finally:await client.aclose()
    asyncio.run(run())


@pytest.mark.parametrize('success',[True,False])
def test_description_uses_location_resource_and_confirms_response(system,success):
    db,_=system
    def handler(request):
        assert request.url.path=='/v1/locations/1'
        assert request.url.params['updateMask']=='profile.description'
        return httpx.Response(200,json={'name':'locations/1','profile':{'description':'Shop'}} if success else {})
    srv,client=service(handler=handler)
    async def run():
        try:
            result=await srv.update_profile_description(db,'t1','accounts/1/locations/1','Shop')
            assert result['success'] is success
        finally:await client.aclose()
    asyncio.run(run())


def test_google_reviews_sync_failure_is_visible(system):
    db,_=system;srv,client=service(handler=lambda request:httpx.Response(403,json={'error':'denied'}))
    async def run():
        try:
            with pytest.raises(HTTPException) as error:await srv.fetch_and_sync_reviews(db,'t1')
            assert error.value.status_code==502
        finally:await client.aclose()
    asyncio.run(run())


def test_location_only_mapping_uses_verified_account(system):
    db,_=system;db.get(BusinessChannel,1).external_account_id='locations/1';db.commit()
    srv,client=service(short=True)
    async def run():
        try:
            channel,location,token=await srv._get_channel_and_credential(db,'t1')
            assert location=='accounts/1/locations/1'
        finally:await client.aclose()
    asyncio.run(run())


@pytest.mark.parametrize('state,success,unknown',[('LIVE',1,False),('PROCESSING',0,True),('REJECTED',0,False)])
def test_daily_publisher_uses_real_endpoint_and_google_state(state,success,unknown):
    credentials=SimpleNamespace(get_valid_credential_for_channel=AsyncMock(return_value=SimpleNamespace(metadata={'gbp_location_name':'accounts/1/locations/1'},access_token='test')))
    now=datetime.now(timezone.utc)
    post=SimpleNamespace(business_channel_id=1,caption='Shop',hashtags=[],call_to_action='',image_url='https://example.com/product.jpg',day=1,title='Post',publish_date=now.date(),publish_time=now.time(),image_path='image.png',image_source='catalogue')
    schedule=SimpleNamespace(tenant_id='t1',business_account_id=1,posts=[post])
    def handler(request):
        assert request.url.path=='/v4/accounts/1/locations/1/localPosts'
        return httpx.Response(200,json={'name':'accounts/1/locations/1/localPosts/1','state':state})
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            result=await GoogleBusinessPublisherProvider(credential_service=credentials,http_client=client).apublish(schedule)
            assert result.successful==success
            assert result.posts[0].outcome_unknown==unknown
    asyncio.run(run())
