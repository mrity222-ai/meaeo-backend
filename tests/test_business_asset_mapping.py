from dataclasses import replace
from pathlib import Path
from types import SimpleNamespace

import pytest
from PIL import Image
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.assets.storage import LocalAssetStorage
from app.campaign.campaign_context import CampaignContextBuilder
from app.campaign.onboarding_context import OnboardingContext
from app.database.models import Asset, Tenant, BusinessAccount, BrandProfile, BusinessProfile
from app.image.catalogue import CatalogueAssetRepository, campaign_catalogue_scope, scoped_image_output
from app.image.catalogue_selector import CatalogueSelector
from app.image.cache import ImageCache
from app.services.asset_service import AssetService
from app.services.campaign_asset_service import CampaignAssetService
from app.services.brand_profile_service import BrandProfileService
from app.schemas.brand import BrandProfileUpdate
from app.security.tenant import TenantContext


@pytest.fixture
def setup(tmp_path, monkeypatch):
    from app.models.config import settings
    monkeypatch.setattr(settings, 'ASSET_STORAGE_ROOT', str(tmp_path / 'storage'))
    monkeypatch.setattr(settings, 'IMAGE_OUTPUT_DIR', str(tmp_path / 'generated'))
    engine = create_engine('sqlite:///:memory:')
    for model in (Tenant, BusinessAccount, Asset, BrandProfile):
        model.__table__.create(engine)
    with Session(engine) as db:
        db.add_all([Tenant(tenant_id='t1', name='One'),Tenant(tenant_id='t2', name='Two')])
        db.add_all([BusinessAccount(id=1,tenant_id='t1',name='Shop1',status='active'),
                    BusinessAccount(id=2,tenant_id='t1',name='Shop2',status='active'),
                    BusinessAccount(id=3,tenant_id='t2',name='Shop3',status='active')])
        db.commit()
        assets = AssetService(db)
        uploaded = []
        for bid, tid, color in [(1,'t1','red'), (2,'t1','blue'), (3,'t2','green')]:
            path = tmp_path / f'{bid}.png'
            Image.new('RGB',(20,20),color).save(path)
            uploaded.append(assets.register_file(tenant_id=tid,business_account_id=bid,source_path=path,source='catalogue'))
        yield db, assets, uploaded
    engine.dispose()


def state(bid=1,tid='t1',logo=None):
    business = BusinessProfile(tenant_id=tid,business_account_id=bid,business_name='Shop',category='Retail',description='Store',country='India')
    brand = BrandProfile(tenant_id=tid,business_account_id=bid,brand_name='Same Name',industry='Retail',tone='Friendly',logo_asset_id=logo)
    onboarding = OnboardingContext(tid,bid,SimpleNamespace(status='active'),business,brand,[],None,None)
    return {'tenant_id':tid,'business_account_id':bid,'campaign_context':CampaignContextBuilder.build(onboarding)}


@pytest.mark.parametrize('bid,tid,index',[(1,'t1',0),(2,'t1',1),(3,'t2',2)])
def test_catalogue_is_owned_even_same_brand(setup,bid,tid,index):
    db,assets,uploaded = setup
    item=state(bid,tid)
    with CampaignAssetService(db).bind_inputs(item):
        repository=CatalogueAssetRepository()
        paths=repository.list('Same Name')
        assert len(paths)==1 and paths[0].name.startswith(uploaded[index].id)
        assert CatalogueSelector().select('default',index=29)==paths[0]
        with pytest.raises(FileNotFoundError):
            repository.get('Same Name',uploaded[(index+1)%3].id+'.png')


@pytest.mark.parametrize('bid,tid',[(2,'t1'),(3,'t2')])
def test_foreign_logo_rejected(setup,bid,tid):
    db,assets,uploaded=setup
    with pytest.raises(ValueError,match='selected business'):
        with CampaignAssetService(db).bind_inputs(state(bid,tid,uploaded[0].id)):
            pytest.fail('Foreign logo accepted')


def test_logo_resolved_and_not_used_as_product(setup):
    db,assets,uploaded=setup
    item=state(1,'t1',uploaded[0].id)
    with CampaignAssetService(db).bind_inputs(item):
        assert Path(item['brand_profile'].logos['primary']).is_file()
        assert CatalogueAssetRepository().list('Same Name')==[]
        with pytest.raises(ValueError,match='No catalogue'):
            CatalogueSelector().select('brand_001')


@pytest.mark.parametrize('deleted',[False,True])
def test_missing_catalogue_never_falls_back(setup,deleted):
    db,assets,uploaded=setup
    if deleted:
        uploaded[0].status='deleted'
        db.commit()
        with CampaignAssetService(db).bind_inputs(state()):
            assert CatalogueAssetRepository().list('brand_001')==[]
    else:
        assets.storage.delete(storage_key=uploaded[0].storage_key)
        with pytest.raises(ValueError,match='missing'):
            with CampaignAssetService(db).bind_inputs(state()):
                pass


def test_original_path_and_selection_rejected(setup):
    db,assets,uploaded=setup
    for field,value in [('original_images',{1:str(assets.storage._path(uploaded[1].storage_key))}),
                        ('catalogue_selection',{1:uploaded[1].id+'.png'})]:
        item=state()
        item[field]=value
        with pytest.raises(ValueError):
            with CampaignAssetService(db).bind_inputs(item):
                pass


def test_storage_ownership_checked(setup):
    db,assets,uploaded=setup
    uploaded[0].storage_key="t1/2/unowned.png"
    with pytest.raises(ValueError,match='storage'):
        assets.resolve_owned_image_path(tenant_id='t1',business_account_id=1,asset_id=uploaded[0].id)


def test_upload_wrong_owner_rejected(setup,tmp_path):
    db,assets,uploaded=setup
    path=tmp_path/'input.png'
    Image.new('RGB',(10,10)).save(path)
    with pytest.raises(ValueError,match='specified tenant'):
        assets.register_file(tenant_id='t2',business_account_id=1,source_path=path,source='catalogue')


def test_brand_update_foreign_logo_not_saved(setup):
    db,assets,uploaded=setup
    brand=BrandProfile(tenant_id='t1',business_account_id=1,brand_name='Shop',industry='Retail',tone='Friendly')
    db.add(brand)
    db.commit()
    with pytest.raises(ValueError):
        BrandProfileService(db).update(TenantContext('t1'),1,BrandProfileUpdate(logo_asset_id=uploaded[1].id))
    db.refresh(brand)
    assert brand.logo_asset_id is None


def test_scopes_restore_and_isolate_cache_output(setup):
    db,assets,uploaded=setup
    with CampaignAssetService(db).bind_inputs(state()):
        first=CatalogueAssetRepository().list('ignored')
        output1=scoped_image_output('day_1.png')
        cache1=ImageCache()._cache_key('same prompt')
        with CampaignAssetService(db).bind_inputs(state(2)):
            assert CatalogueAssetRepository().list('ignored')!=first
            assert scoped_image_output('day_1.png')!=output1
            assert ImageCache()._cache_key('same prompt')!=cache1
        assert CatalogueAssetRepository().list('ignored')==first
        assert scoped_image_output('day_1.png')==output1
    assert scoped_image_output('day_1.png')==Path('day_1.png')


def test_concurrent_contexts_do_not_mix(tmp_path):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier
    barrier=Barrier(2)
    def run(number):
        path=tmp_path/f'{number}.png'
        Image.new('RGB',(10,10)).save(path)
        with campaign_catalogue_scope([path]):
            barrier.wait(timeout=5)
            return CatalogueSelector().select('same',index=10)
    with ThreadPoolExecutor(max_workers=2) as pool:
        results=list(pool.map(run,[1,2]))
    assert results==[tmp_path/'1.png',tmp_path/'2.png']


def test_runner_binds_asset_scope(setup,monkeypatch):
    from contextlib import contextmanager
    from app.graph import runner as module
    db,assets,uploaded=setup
    @contextmanager
    def session():
        yield db
    monkeypatch.setattr(module,'SessionLocal',session)
    runner=object.__new__(module.GraphRunner)
    def run(item):
        path=CatalogueSelector().select('legacy_default')
        assert path.name.startswith(uploaded[0].id)
        assert item['brand_profile'].name=='Same Name'
        return {'status':'completed'}
    runner._run=run
    assert runner.run(state())['status']=='completed'


def test_langgraph_preserves_catalogue_scope(tmp_path):
    from langgraph.graph import StateGraph, START, END
    from typing import TypedDict
    class State(TypedDict):
        name: str
    path=tmp_path/'owned.png'
    Image.new('RGB',(10,10)).save(path)
    graph=StateGraph(State)
    graph.add_node('select', lambda value: {'name':str(CatalogueSelector().select('legacy'))})
    graph.add_edge(START,'select')
    graph.add_edge('select',END)
    with campaign_catalogue_scope([path]):
        assert graph.compile().invoke({'name':''})['name']==str(path)
