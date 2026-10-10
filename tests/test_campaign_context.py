from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.campaign.campaign_context import CampaignContextBuilder
from app.campaign.onboarding_context import OnboardingContext, OnboardingContextService
from app.database.models import BusinessAccount, BusinessProfile, BrandProfile, Tenant
from app.security.tenant import TenantContext


def context():
    business = BusinessProfile(tenant_id='t1', business_account_id=1, business_name='Shop',
                               category='Retail', description='Local shop', country='India')
    brand = BrandProfile(tenant_id='t1', business_account_id=1, brand_name='My Shop',
                         industry='Retail', tone='Friendly')
    return OnboardingContext('t1', 1, SimpleNamespace(status='active'), business, brand, [], None, None)


def replace_context(original, **kwargs):
    from dataclasses import replace
    return replace(original, **kwargs)


def test_brand_without_logo_and_optional_data():
    result = CampaignContextBuilder.build(context())
    assert result.brand.name == 'My Shop'
    assert result.brand.logos == {}
    assert result.products == [] and result.audience is None


def test_brand_with_logo():
    item = context()
    item.brand.logo_asset_id = 'logo123'
    assert CampaignContextBuilder.build(item).brand.logos == {'primary': 'logo123'}


@pytest.mark.parametrize('profile', ['business','brand'])
def test_missing_profile(profile):
    with pytest.raises(ValueError, match='profile is required'):
        CampaignContextBuilder.build(replace_context(context(), **{profile:None}))


@pytest.mark.parametrize('profile,field', [
    ('business','business_name'), ('business','category'), ('business','description'),
    ('business','country'), ('brand','brand_name'), ('brand','industry'), ('brand','tone')])
def test_missing_field(profile, field):
    item = context()
    setattr(getattr(item, profile), field, '  ')
    with pytest.raises(ValueError, match=field):
        CampaignContextBuilder.build(item)


@pytest.mark.parametrize('profile,field,value', [
    ('business','tenant_id','other'), ('brand','tenant_id','other'),
    ('business','business_account_id',2), ('brand','business_account_id',2)])
def test_wrong_profile_scope(profile, field, value):
    item = context()
    setattr(getattr(item, profile), field, value)
    with pytest.raises(ValueError, match='selected business'):
        CampaignContextBuilder.build(item)


def test_loader_rejects_wrong_tenant_and_inactive_account():
    engine = create_engine('sqlite:///:memory:')
    Tenant.__table__.create(engine)
    BusinessAccount.__table__.create(engine)
    with Session(engine) as db:
        db.add(Tenant(tenant_id='t1', name='Test'))
        db.add(BusinessAccount(id=1, tenant_id='t1', name='Test', status='inactive'))
        db.commit()
        service = OnboardingContextService(db)
        with pytest.raises(ValueError, match='not found'):
            service.load(TenantContext('other'),1)
        with pytest.raises(ValueError, match='not active'):
            service.load(TenantContext('t1'),1)
    engine.dispose()

@pytest.mark.parametrize('missing', ['business', 'brand'])
def test_execute_validates_before_runner(monkeypatch, missing):
    from app.api import campaign_lifecycle as api
    campaign = SimpleNamespace(status='draft', execution_mode='autonomous', campaign_name='Test')
    monkeypatch.setattr(api, 'CampaignLifecycleService', lambda db: SimpleNamespace(get=lambda *a: campaign))
    monkeypatch.setattr(OnboardingContextService, 'load', lambda *a: replace_context(context(), **{missing:None}))
    def forbidden():
        pytest.fail('Runner must not start for missing context')
    monkeypatch.setattr(api, 'GraphRunner', forbidden)
    db = SimpleNamespace(rollback=lambda: None)
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as error:
        api.execute_campaign(1, 1, TenantContext('t1'), db)
    assert error.value.status_code == 409
    assert campaign.status == 'draft'


def test_execute_passes_correct_brand(monkeypatch):
    from app.api import campaign_lifecycle as api
    campaign = SimpleNamespace(status='draft', execution_mode='autonomous', campaign_name='Test')
    monkeypatch.setattr(api, 'CampaignLifecycleService', lambda db: SimpleNamespace(get=lambda *a: campaign))
    monkeypatch.setattr(OnboardingContextService, 'load', lambda *a: context())
    captured = {}
    def run(state):
        captured.update(state)
        return {'status':'completed', 'campaign_bundle': SimpleNamespace(content='content'), 'schedule':'schedule'}
    monkeypatch.setattr(api, 'GraphRunner', lambda: SimpleNamespace(run=run))
    monkeypatch.setattr(api, 'CampaignPostService', lambda db: SimpleNamespace(create_from_content_and_schedule=lambda *a: None))
    assert api.execute_campaign(1, 1, TenantContext('t1'), SimpleNamespace(refresh=lambda c: None)) is campaign
    assert captured['brand_name'] == 'My Shop'
    assert captured['brand_profile'].name == 'My Shop'
    assert captured['campaign_context'].business.business_name == 'Shop'


def test_run_rejects_brand_override(monkeypatch):
    from app.api import campaigns as api
    from app.schemas.campaign_api import CampaignRunRequest
    from fastapi import HTTPException
    monkeypatch.setattr(OnboardingContextService, 'load', lambda *a: context())
    def forbidden():
        pytest.fail('Runner must not start for brand mismatch')
    monkeypatch.setattr(api, 'build_graph_runner', forbidden)
    with pytest.raises(HTTPException) as error:
        api.run_campaign(CampaignRunRequest(business_account_id=1, user_input='Create posts', brand_name='Other'),
                         TenantContext('t1'), object())
    assert error.value.status_code == 409
