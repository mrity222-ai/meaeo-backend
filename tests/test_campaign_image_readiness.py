import asyncio
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import HTTPException, UploadFile
from PIL import Image
from pydantic import ValidationError
from starlette.datastructures import Headers
from sqlalchemy import select

from test_business_asset_mapping import setup, state
from app.api.assets import upload_catalogue_asset, list_assets
from app.database.models import Asset, BrandProfile
from app.models.config import settings
from app.security.tenant import TenantContext
from app.services.campaign_asset_service import CampaignAssetService
from app.schemas.image import ImageStrategy, ImageSourceMode, OverlayTarget
from app.schemas.campaign_api import CampaignRunRequest
from app.image.providers.gemini import GeminiImageProvider
from app.image.provider_factory import ImageProviderFactory
from app.image.cache import ImageCache
from app.image.generation_manager import ImageGenerationManager
from app.image.schemas import GeneratedImageResult


def upload(db,color='purple',source='catalogue'):
    buffer=BytesIO();Image.new('RGB',(30,30),color).save(buffer,format='PNG');buffer.seek(0)
    file=UploadFile(filename='product.png',file=buffer,headers=Headers({'content-type':'image/png'}))
    return upload_catalogue_asset(business_account_id=1,file=file,source=source,tenant=TenantContext('t1'),db=db)


def test_catalogue_list_excludes_logo_and_campaign_outputs(setup,tmp_path):
    db,assets,uploaded=setup
    db.add(BrandProfile(tenant_id='t1',business_account_id=1,brand_name='Brand',industry='Retail',tone='Friendly',logo_asset_id=uploaded[0].id));db.commit()
    product=upload(db,'orange');logo=upload(db,'yellow','logo')
    path=tmp_path/'poster.png';Image.new('RGB',(20,20),'white').save(path)
    poster=assets.register_file(tenant_id='t1',business_account_id=1,source_path=path,source='campaign')
    result=list_assets(business_account_id=1,tenant=TenantContext('t1'),db=db)
    assert [a.id for a in result]==[product.id]
    assert logo.source=='logo' and poster.source=='campaign'


def test_logo_upload_and_generated_posts_do_not_consume_product_limit(setup,tmp_path,monkeypatch):
    db,assets,uploaded=setup
    monkeypatch.setattr(settings,'ASSET_MAX_IMAGES',1)
    assert upload(db,'purple','logo').source=='logo'
    path=tmp_path/'generated.png';Image.new('RGB',(20,20),'pink').save(path)
    assets.register_file(tenant_id='t1',business_account_id=1,source_path=path,source='campaign')
    with pytest.raises(HTTPException) as error:upload(db,'orange')
    assert error.value.status_code==409
    # Same product bytes are a retry, not a second product.
    buffer=BytesIO();Image.new('RGB',(20,20),'red').save(buffer,format='PNG');buffer.seek(0)
    result=upload_catalogue_asset(business_account_id=1,file=UploadFile(filename='retry.png',file=buffer,headers=Headers({'content-type':'image/png'})),source='catalogue',tenant=TenantContext('t1'),db=db)
    assert result.id==uploaded[0].id


def test_same_file_separate_logo_role_does_not_hide_product(setup):
    db,assets,uploaded=setup
    path=assets.resolve_owned_image_path(tenant_id='t1',business_account_id=1,asset_id=uploaded[0].id)
    logo=assets.register_file(tenant_id='t1',business_account_id=1,source_path=path,source='logo')
    assert logo.id!=uploaded[0].id


def test_catalogue_default_overrides_planner_ai_without_changing_agent(setup):
    db,_,_=setup;item=state()
    with CampaignAssetService(db).bind_inputs(item):
        item['image_strategy']=ImageStrategy(source_mode='ai',overlay_target='none')
        item['campaign']=SimpleNamespace(image_strategy=item['image_strategy'])
        CampaignAssetService.apply_image_strategy(item)
        assert item['image_strategy'].source_mode==ImageSourceMode.CATALOGUE
        assert item['image_strategy'].overlay_target==OverlayTarget.BOTH
        assert item['campaign'].image_strategy.source_mode==ImageSourceMode.CATALOGUE


def test_explicit_ai_choice_preserved(setup):
    db,_,_=setup;item=state();item['image_strategy']=ImageStrategy(source_mode='ai',overlay_target='none')
    with CampaignAssetService(db).bind_inputs(item):
        item['image_strategy']=ImageStrategy(source_mode='catalogue')
        CampaignAssetService.apply_image_strategy(item)
        assert item['image_strategy'].source_mode==ImageSourceMode.AI
        assert item['image_strategy'].overlay_target==OverlayTarget.NONE


@pytest.mark.parametrize('mode',['original','catalogue'])
def test_requested_product_mode_requires_catalogue(setup,mode):
    db,_,uploaded=setup;uploaded[0].status='deleted';db.commit()
    item=state();item['image_strategy']=ImageStrategy(source_mode=mode)
    with pytest.raises(ValueError,match='Upload a product'):
        with CampaignAssetService(db).bind_inputs(item):pass


def test_both_rejected_at_api_and_service(setup):
    with pytest.raises(ValidationError):CampaignRunRequest(business_account_id=1,user_input='Post',image_strategy={'source_mode':'both'})
    db,_,_=setup;item=state();item['image_strategy']=ImageStrategy(source_mode='both')
    with pytest.raises(ValueError,match='Combined'):
        with CampaignAssetService(db).bind_inputs(item):pass


def test_gemini_failure_does_not_create_mock(tmp_path,monkeypatch):
    monkeypatch.setattr(settings,'GEMINI_API_KEY',None)
    output=tmp_path/'image.png'
    with pytest.raises(RuntimeError,match='Gemini image generation failed'):GeminiImageProvider().generate('Product',output)
    assert not output.exists()
    with pytest.raises(RuntimeError):asyncio.run(GeminiImageProvider().agenerate('Product',output))


def test_production_mock_provider_rejected(monkeypatch):
    monkeypatch.setattr(settings,'APP_ENV','production');monkeypatch.setattr(settings,'IMAGE_MODEL_PROVIDER','mock')
    with pytest.raises(ValueError,match='disabled in production'):ImageProviderFactory.get()


def test_unverified_or_mock_images_are_not_real_cache_hits(tmp_path,monkeypatch):
    monkeypatch.chdir(tmp_path);cache=ImageCache();image=tmp_path/'large.png';image.write_bytes(b'x'*25000)
    cache.save('prompt',image,provider='mock');assert not cache.exists('prompt')
    legacy=cache.load('prompt');legacy.write_bytes(b'x'*25000);assert not cache.exists('prompt')
    cache.save('prompt',image,provider='gemini');assert cache.exists('prompt')


def test_cached_images_return_shared_output_path(tmp_path,monkeypatch):
    monkeypatch.chdir(tmp_path);manager=ImageGenerationManager();calls=[]
    class Provider:
        def generate(self,prompt,path):
            calls.append(prompt);path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(b'x'*25000)
            return GeneratedImageResult(image_path=path,provider='gemini',prompt=prompt)
        async def agenerate(self,prompt,path):return self.generate(prompt,path)
    monkeypatch.setattr(ImageProviderFactory,'get',lambda:Provider())
    first=manager.generate('prompt',tmp_path/'generated/first.png')
    second=asyncio.run(manager.agenerate('prompt',tmp_path/'generated/second.png'))
    assert first.image_path==tmp_path/'generated/first.png'
    assert second.image_path==tmp_path/'generated/second.png'
    assert second.image_path.is_file() and calls==['prompt']

@pytest.mark.parametrize('provider',['huggingface','openai','stability'])
def test_real_provider_errors_do_not_return_mock(tmp_path,monkeypatch,provider):
    if provider=='huggingface':
        from app.image.providers import huggingface as module
        monkeypatch.setattr(module,'InferenceClient',lambda **kwargs: (_ for _ in ()).throw(RuntimeError('offline')))
        instance=module.HuggingFaceImageProvider()
    elif provider=='openai':
        from app.image.providers.openai import OpenAIImageProvider
        instance=OpenAIImageProvider()
        monkeypatch.setattr(instance,'_get_client',lambda: (_ for _ in ()).throw(RuntimeError('offline')))
    else:
        from app.image.providers.stability import StabilityImageProvider
        instance=StabilityImageProvider()
        monkeypatch.setattr(instance,'_get_api_key',lambda:'')
    with pytest.raises(RuntimeError,match='image generation failed'):instance.generate('Product',tmp_path/'failed.png')
    assert not (tmp_path/'failed.png').exists()


def test_real_product_image_is_used_without_ai_generation(setup,monkeypatch):
    from app.agents.image import ImageGeneratorAgent
    from app.schemas.content import ContentPlan,ContentPost
    db,assets,uploaded=setup;item=state()
    item['image_strategy']=ImageStrategy(source_mode='catalogue',overlay_target='none')
    item['content']=ContentPlan(duration_days=1,campaign_summary='Shop',posts=[ContentPost(day=1,platforms=['facebook'],objective='Awareness',content_pillar='Product',title='Product',caption='Shop product',hashtags=[],image_prompt='Product')])
    agent=ImageGeneratorAgent()
    monkeypatch.setattr(agent.image_provider_manager,'generate',lambda *args:pytest.fail('AI generation called for catalogue'))
    with CampaignAssetService(db).bind_inputs(item):
        result=agent.invoke(CampaignAssetService.apply_image_strategy(item))
    assert result['image_plan'].images[0].source==ImageSourceMode.CATALOGUE
    assert Path(result['image_plan'].images[0].image_path).read_bytes()==assets.resolve_owned_image_path(tenant_id='t1',business_account_id=1,asset_id=uploaded[0].id).read_bytes()


def test_rendered_catalogue_overlay_is_registered_as_campaign_asset(setup):
    from app.image.catalogue import scoped_image_output
    db,assets,_=setup
    with CampaignAssetService(db).bind_inputs(state()):
        path=scoped_image_output(Path('generated/poster.png'))
        Image.new('RGB',(25,25),'pink').save(path)
        # Existing scheduler passes catalogue after overlay; application storage corrects it.
        result=assets.register_file(tenant_id='t1',business_account_id=1,source_path=path,source='catalogue')
        assert result.source=='campaign'
    assert result.id not in [item.id for item in db.scalars(assets.catalogue_statement('t1',1)).all()]
