import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock
import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from app.api.google_business import router
from app.database.models import Tenant, User, UserTenant, BusinessAccount, BusinessChannel, GoogleBusinessReview, GoogleBusinessPost, BusinessProfile
from app.database.session import get_db
from app.security.dependencies import get_current_user
from app.security.authentication import AuthenticatedUser
from app.services.google_reviews_service import GoogleBusinessService

@pytest.fixture
def system():
    engine = create_engine('sqlite://', connect_args={'check_same_thread':False}, poolclass=StaticPool)
    for model in (Tenant, User, UserTenant, BusinessAccount, BusinessChannel, GoogleBusinessReview, GoogleBusinessPost, BusinessProfile):
        model.__table__.create(engine)
    with Session(engine) as db:
        db.add_all([Tenant(id=1,tenant_id='t1',name='First'),Tenant(id=2,tenant_id='t2',name='Other'),User(id=1,email='test@example.com',password_hash='unused')])
        db.flush()
        db.add(UserTenant(user_id=1,tenant_id=1,is_active=True))
        for i, tenant in ((1,'t1'),(2,'t1'),(3,'t2')):
            db.add(BusinessAccount(id=i,tenant_id=tenant,name=f'Shop{i}',status='active'))
            db.add(BusinessChannel(id=i,tenant_id=tenant,business_account_id=i,platform='google_business',external_account_id=f'accounts/1/locations/{i}',account_name=f'Shop{i}',status='active',is_enabled=True))
            db.add(GoogleBusinessReview(id=i,tenant_id=tenant,business_channel_id=i,location_name=f'accounts/1/locations/{i}',review_id=f'r{i}',reviewer_name='Customer',star_rating=5))
            db.add(GoogleBusinessPost(id=i,tenant_id=tenant,business_channel_id=i,location_name=f'accounts/1/locations/{i}',summary='Offer'))
        db.commit()
        app=FastAPI(); app.include_router(router)
        app.dependency_overrides[get_db]=lambda:db
        app.dependency_overrides[get_current_user]=lambda:AuthenticatedUser(1,'test@example.com',True)
        with TestClient(app) as client:
            yield db,client
    engine.dispose()

@pytest.mark.parametrize('path',['status','reviews','offers','offers/generate','offers/publish','reviews/generate-reply','reviews/send-reply','seo/optimize','profile/update-description'])
def test_every_route_rejects_other_tenant(system,path):
    method='GET' if path in ('status','reviews','offers') else 'POST'
    response=system[1].request(method,f'/google-business/{path}?business_account_id=3',headers={'X-Tenant-ID':'t2'},json={})
    assert response.status_code==403

@pytest.mark.parametrize('business',[3,999])
def test_foreign_or_missing_business(system,business):
    response=system[1].get(f'/google-business/status?business_account_id={business}',headers={'X-Tenant-ID':'t1'})
    assert response.status_code==404

def test_status_and_posts_selected_business(system):
    client=system[1]
    status=client.get('/google-business/status?business_account_id=2',headers={'X-Tenant-ID':'t1'})
    assert status.status_code==200 and status.json()['channel_id']==2
    posts=client.get('/google-business/offers?business_account_id=2',headers={'X-Tenant-ID':'t1'})
    assert [p['id'] for p in posts.json()]==[2]

@pytest.mark.parametrize('record',[2,3,999])
def test_review_write_rejects_other_business_before_agent(system,record):
    response=system[1].post('/google-business/reviews/generate-reply?business_account_id=1',headers={'X-Tenant-ID':'t1'},json={'review_id':record})
    assert response.status_code==404

def test_location_rejected_before_credentials_or_network(system):
    credentials=SimpleNamespace(get_valid_credential_for_channel=AsyncMock())
    service=GoogleBusinessService(credential_service=credentials,business_account_id=1)
    with pytest.raises(HTTPException) as error:
        asyncio.run(service._get_channel_and_credential(system[0],'t1','accounts/1/locations/2'))
    assert error.value.status_code==404
    credentials.get_valid_credential_for_channel.assert_not_called()

def test_correct_channel_and_token(system):
    credential=SimpleNamespace(tenant_id='t1',business_account_id=2,business_channel_id=2,platform='google_business',metadata={},access_token='test')
    credentials=SimpleNamespace(get_valid_credential_for_channel=AsyncMock(return_value=credential))
    service=GoogleBusinessService(credential_service=credentials,business_account_id=2)
    channel,location,token=asyncio.run(service._get_channel_and_credential(system[0],'t1'))
    assert (channel.id,location,token)==(2,'accounts/1/locations/2','test')
    assert credentials.get_valid_credential_for_channel.call_args.kwargs['business_channel_id']==2
    assert service.owned_review(system[0],'t1',2).id==2

@pytest.mark.parametrize('field,value',[('tenant_id','t2'),('business_account_id',1),('business_channel_id',1),('platform','facebook')])
def test_mismatched_credentials_rejected(system,field,value):
    data=dict(tenant_id='t1',business_account_id=2,business_channel_id=2,platform='google_business',metadata={},access_token='test');data[field]=value
    service=GoogleBusinessService(credential_service=SimpleNamespace(get_valid_credential_for_channel=AsyncMock(return_value=SimpleNamespace(**data))),business_account_id=2)
    with pytest.raises(HTTPException) as error:
        asyncio.run(service._get_channel_and_credential(system[0],'t1'))
    assert error.value.status_code==403

def test_inactive_membership_and_missing_context(system):
    db,client=system
    membership=db.query(UserTenant).first();membership.is_active=False;db.commit()
    assert client.get('/google-business/status?business_account_id=1',headers={'X-Tenant-ID':'t1'}).status_code==403
    assert client.get('/google-business/status?business_account_id=1').status_code==400

def test_disabled_channel_excluded(system):
    db,client=system;db.get(BusinessChannel,1).is_enabled=False;db.commit()
    assert client.get('/google-business/offers?business_account_id=1',headers={'X-Tenant-ID':'t1'}).json()==[]
    service=GoogleBusinessService(credential_service=SimpleNamespace(),business_account_id=1)
    with pytest.raises(HTTPException):service.owned_review(db,'t1',1)


def test_reviews_only_selected_channel_without_live_credentials(system):
    service=GoogleBusinessService(credential_service=SimpleNamespace(get_valid_credential_for_channel=AsyncMock(return_value=None)),business_account_id=2)
    rows=asyncio.run(service.fetch_and_sync_reviews(system[0],'t1'))
    assert [r.id for r in rows]==[2]


def test_unmapped_or_corrupt_review_rejected(system):
    db,_=system
    review=db.get(GoogleBusinessReview,1)
    review.location_name='accounts/1/locations/2';db.commit()
    service=GoogleBusinessService(credential_service=SimpleNamespace(),business_account_id=1)
    with pytest.raises(HTTPException):service.owned_review(db,'t1',1)
    review.business_channel_id=None;db.commit()
    with pytest.raises(HTTPException):service.owned_review(db,'t1',1)

@pytest.mark.parametrize('path,payload',[
    ('reviews/send-reply',{'review_id':2,'reply_text':'Thanks'}),
    ('offers/publish',{'location_name':'accounts/1/locations/2','summary':'Offer'}),
    ('profile/update-description',{'location_name':'accounts/1/locations/2','description':'Shop'}),
])
def test_writes_reject_wrong_business_location(system,path,payload):
    response=system[1].post(f'/google-business/{path}?business_account_id=1',headers={'X-Tenant-ID':'t1'},json=payload)
    assert response.status_code==404
