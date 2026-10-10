import asyncio
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import httpx
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.database.models import Tenant, BusinessAccount, BusinessChannel, Campaign, CampaignPost, CampaignPostPublication
from app.workers import campaign_scheduler as worker
from app.publishers import manager as publishing
from app.services.campaign_post_publishing_service import CampaignPostPublishingService
from app.repositories.campaign_post_publication_repository import CampaignPostPublicationRepository
from app.schemas.publishing import PublishedPost, PublishingResult, publication_failure_flags


@pytest.fixture
def system(tmp_path, monkeypatch):
    engine=create_engine(f"sqlite:///{tmp_path / 'posting.db'}",connect_args={'timeout':10})
    for model in (Tenant,BusinessAccount,BusinessChannel,Campaign,CampaignPost,CampaignPostPublication):
        model.__table__.create(engine)
    sessions=sessionmaker(engine)
    monkeypatch.setattr(worker,'SessionLocal',sessions)
    monkeypatch.setattr(publishing,'SessionLocal',sessions)
    monkeypatch.setattr(publishing,'AssetPreparationService',lambda db:SimpleNamespace(prepare_schedule=lambda schedule:schedule))
    with sessions() as db:
        db.add(Tenant(tenant_id='t1',name='Test'))
        db.add(BusinessAccount(id=1,tenant_id='t1',name='Shop',status='active'))
        db.add(Campaign(id=1,tenant_id='t1',business_account_id=1,campaign_name='Test',
                        execution_mode='human_intervention',status='running'))
        for index, platform in enumerate(['facebook','instagram'],1):
            db.add(BusinessChannel(id=index,tenant_id='t1',business_account_id=1,platform=platform,
                                   external_account_id=platform,account_name=platform,status='active',is_enabled=True))
        db.add(CampaignPost(id=1,campaign_id=1,tenant_id='t1',day=1,title='Post',caption='Hello',objective='Awareness',content_pillar='Product',image_prompt='Product photo',
                            platforms=['facebook','instagram'],review_status='approved',publish_status='pending',
                            scheduled_for=datetime.now(timezone.utc)-timedelta(minutes=1),image_path='image.png'))
        db.commit()
    calls=[]
    behaviors={}
    class Provider:
        def __init__(self,platform): self.platform=platform
        def publish(self,schedule):
            calls.append(self.platform)
            behavior=behaviors.get(self.platform)
            if isinstance(behavior,Exception): raise behavior
            if behavior=='empty': return PublishingResult()
            item=schedule.posts[0]
            success=behavior is None
            post=PublishedPost(platform=self.platform,day=item.day,title=item.title,image_path=item.image_path,
                                status='published' if success else 'failed',external_id=self.platform+'123' if success else '',
                                retryable=behavior=='retry',errors=[] if success else ['Failure'])
            return PublishingResult(posts=[post],successful=int(success),failed=int(not success))
        async def apublish(self,schedule): return self.publish(schedule)
    monkeypatch.setattr(publishing.PublisherFactory,'get_provider',lambda platform:Provider(platform))
    yield sessions,calls,behaviors
    engine.dispose()


def read(system):
    with system[0]() as db:
        return db.get(CampaignPost,1)


def set_post(system,**kwargs):
    with system[0]() as db:
        post=db.get(CampaignPost,1)
        for key,value in kwargs.items(): setattr(post,key,value)
        db.commit()


@pytest.mark.parametrize('review',['pending','draft','rejected'])
def test_manual_unapproved_never_publishes(system,review):
    set_post(system,review_status=review)
    assert worker.CampaignScheduler().process_due_posts()==0
    assert not worker.CampaignScheduler().process_single_post(1)
    assert system[1]==[]


def test_due_time_always_enforced(system):
    set_post(system,scheduled_for=datetime.now(timezone.utc)+timedelta(hours=1))
    assert not worker.CampaignScheduler().process_single_post(1,enforce_due_time=False)
    assert worker.CampaignScheduler().process_due_posts()==0
    assert system[1]==[]


@pytest.mark.parametrize('field,value',[('scheduled_for',None),('next_retry_at',datetime.now(timezone.utc)+timedelta(hours=1)),
                                       ('publish_attempts',3),('publish_status','processing')])
def test_ineligible_post_skipped(system,field,value):
    set_post(system,**{field:value})
    assert not worker.CampaignScheduler().process_single_post(1)
    assert system[1]==[]


def test_autonomous_pending_allowed_rejected_blocked(system):
    with system[0]() as db:
        db.get(Campaign,1).execution_mode='autonomous'; db.commit()
    set_post(system,review_status='pending')
    assert worker.CampaignScheduler().process_single_post(1)
    assert len(system[1])==2


@pytest.mark.parametrize('kind',['campaign','business'])
def test_inactive_parent_blocked(system,kind):
    with system[0]() as db:
        db.get(Campaign if kind=='campaign' else BusinessAccount,1).status='paused'; db.commit()
    assert worker.CampaignScheduler().process_due_posts()==0
    assert system[1]==[]


def test_success_repeated_task_no_duplicate(system):
    assert worker.CampaignScheduler().process_single_post(1)
    assert worker.CampaignScheduler().process_single_post(1)
    assert system[1]==['facebook','instagram']
    assert read(system).external_ids=={'facebook':'facebook123','instagram':'instagram123'}


def test_partial_retry_only_failed_platform(system):
    system[2]['instagram']='retry'
    assert not worker.CampaignScheduler().process_single_post(1)
    assert read(system).publish_status=='pending'
    assert read(system).external_ids=={'facebook':'facebook123'}
    assert not worker.CampaignScheduler().process_single_post(1)
    system[2].clear()
    set_post(system,next_retry_at=datetime.now(timezone.utc)-timedelta(seconds=1))
    assert worker.CampaignScheduler().process_single_post(1)
    assert system[1]==['facebook','instagram','instagram']


def test_permanent_failure_visible(system):
    system[2]['instagram']='permanent'
    assert not worker.CampaignScheduler().process_single_post(1)
    post=read(system)
    assert post.publish_status=='failed' and 'instagram' in post.publishing_error
    assert not worker.CampaignScheduler().process_single_post(1)
    assert system[1]==['facebook','instagram']


@pytest.mark.parametrize('failure',[httpx.ReadTimeout('response lost'),'empty'])
def test_uncertain_result_never_blind_retried(system,failure):
    system[2]['instagram']=failure
    assert not worker.CampaignScheduler().process_single_post(1)
    assert read(system).publish_status=='reconciliation_required'
    assert worker.CampaignScheduler().process_due_posts()==0
    assert system[1]==['facebook','instagram']
    with system[0]() as db:
        pub=db.scalar(select(CampaignPostPublication).where(CampaignPostPublication.platform=='instagram'))
        assert pub.status=='reconciliation_required'


def test_retry_limit(system):
    system[2]['instagram']='retry'
    for attempt in range(3):
        set_post(system,next_retry_at=None)
        assert not worker.CampaignScheduler().process_single_post(1)
    assert read(system).publish_status=='failed' and read(system).publish_attempts==3
    assert system[1].count('facebook')==1


def test_stale_work_requires_reconciliation(system):
    now=datetime.now(timezone.utc)
    set_post(system,publish_status='processing',publishing_started_at=now-timedelta(minutes=11))
    assert worker.CampaignScheduler().process_due_posts(now=now)==0
    assert read(system).publish_status=='reconciliation_required'
    assert system[1]==[]


def test_concurrent_post_claim(system):
    barrier=Barrier(2)
    def claim(_):
        with system[0]() as db:
            barrier.wait(timeout=5)
            post=worker.CampaignScheduler()._claim_next_due_post(db,datetime.now(timezone.utc))
            return post.id if post else None
    with ThreadPoolExecutor(max_workers=2) as pool:
        results=list(pool.map(claim,range(2)))
    assert results.count(1)==1
    assert read(system).publish_attempts==1


def test_concurrent_publication_claim(system):
    with system[0]() as db:
        pub=CampaignPostPublicationRepository(db).create(tenant_id='t1',campaign_post_id=1,
            business_channel_id=1,platform='facebook',idempotency_key='test-key')
        pub_id=pub.id
    barrier=Barrier(2)
    def claim(_):
        with system[0]() as db:
            pub=db.get(CampaignPostPublication,pub_id)
            barrier.wait(timeout=5)
            return CampaignPostPublicationRepository(db).mark_processing(pub) is not None
    with ThreadPoolExecutor(max_workers=2) as pool:
        assert list(pool.map(claim,range(2))).count(True)==1


def test_utc_schedule_not_reinterpreted_as_local(system):
    with system[0]() as db:
        campaign=db.get(Campaign,1)
        campaign.timezone='Asia/Kolkata'
        schedule=CampaignPostPublishingService(db)._build_schedule(campaign,[db.get(CampaignPost,1)],'t1')
        assert schedule.timezone=='UTC'
        assert publishing._is_post_due(schedule,schedule.posts[0])


def test_empty_platforms_never_marked_published(system):
    set_post(system,platforms=[])
    assert not worker.CampaignScheduler().process_single_post(1)
    assert read(system).publish_status=='failed'


def test_async_publication_status_saved(system):
    set_post(system,publish_status='processing')
    with system[0]() as db:
        schedule=CampaignPostPublishingService(db)._build_schedule(db.get(Campaign,1),[db.get(CampaignPost,1)],'t1')
    result=asyncio.run(publishing.PublishManager().apublish(schedule))
    assert result.successful==2
    with system[0]() as db:
        assert all(pub.status=='published' for pub in db.scalars(select(CampaignPostPublication)))


def test_missing_post_identity_defers_delivery(system):
    with system[0]() as db:
        schedule=CampaignPostPublishingService(db)._build_schedule(db.get(Campaign,1),[db.get(CampaignPost,1)],'t1')
    for post in schedule.posts: post.campaign_post_id=None
    result=publishing.PublishManager().publish(schedule)
    assert all(post.status=='scheduled' for post in result.posts)
    assert system[1]==[]


def test_invalid_timezone_does_not_publish(system):
    with system[0]() as db:
        schedule=CampaignPostPublishingService(db)._build_schedule(db.get(Campaign,1),[db.get(CampaignPost,1)],'t1')
    schedule.timezone='invalid'
    with pytest.raises(Exception): publishing.PublishManager().publish(schedule)
    assert system[1]==[]


def test_preflight_failure_recorded_per_platform(system,monkeypatch):
    def prepare(schedule):
        raise ValueError('Missing image asset')
    monkeypatch.setattr(publishing,'AssetPreparationService',lambda db:SimpleNamespace(prepare_schedule=prepare))
    assert not worker.CampaignScheduler().process_single_post(1)
    assert system[1]==[]
    with system[0]() as db:
        pubs=db.scalars(select(CampaignPostPublication)).all()
        assert len(pubs)==2 and all(pub.status=='failed' and 'Missing' in pub.last_error for pub in pubs)


@pytest.mark.parametrize('name,class_name',[
    ('facebook','FacebookPublisherProvider'),('instagram','InstagramPublisherProvider'),
    ('linkedin','LinkedInPublisherProvider'),('google_business','GoogleBusinessPublisherProvider')])
def test_provider_timeout_flags_preserved(system,name,class_name):
    import importlib
    module=importlib.import_module('app.publishers.providers.'+name)
    provider=getattr(module,class_name)
    with system[0]() as db:
        post=CampaignPostPublishingService(db)._build_schedule(db.get(Campaign,1),[db.get(CampaignPost,1)],'t1').posts[0]
    account=SimpleNamespace(platform_account_id='account') if name=='instagram' else 'account'
    item=provider._failed_post(post,account,httpx.ReadTimeout('response lost'))
    assert item.outcome_unknown and not item.retryable


def test_post_api_exposes_failure_and_platform_status(system):
    from app.api.campaign_posts import CampaignPostResponse
    system[2]['instagram']='permanent'
    worker.CampaignScheduler().process_single_post(1)
    with system[0]() as db:
        response=CampaignPostResponse.model_validate(db.get(CampaignPost,1))
        assert response.publish_status=='failed'
        assert response.publishing_error
        assert {item.platform:item.status for item in response.publications}=={'facebook':'published','instagram':'failed'}


def test_concurrent_workers_do_not_send_twice(system):
    barrier=Barrier(2)
    def run(_):
        barrier.wait(timeout=5)
        return worker.CampaignScheduler().process_single_post(1)
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(run,range(2)))
    assert system[1].count('facebook')==1
    assert system[1].count('instagram')==1
    assert read(system).publish_status=='published'
