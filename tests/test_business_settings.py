from pathlib import Path
import pytest
from PIL import Image
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from app.database.models import Tenant, BusinessAccount, BusinessProfile, BrandProfile, TargetAudience, MarketingPreferences, Asset
from app.api.business import router
from app.api.dependencies import get_tenant_context
from app.database.session import get_db
from app.security.tenant import TenantContext
from app.services.asset_service import AssetService
from app.services.business_settings_service import BusinessSettingsService


@pytest.fixture
def setup(tmp_path, monkeypatch):
    from app.models.config import settings
    monkeypatch.setattr(settings, "ASSET_STORAGE_ROOT", str(tmp_path / "assets"))
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    for model in (Tenant, BusinessAccount, Asset, BusinessProfile, BrandProfile, TargetAudience, MarketingPreferences):
        model.__table__.create(engine)
    db = Session(engine)
    db.add_all([Tenant(tenant_id="t1",name="One"),Tenant(tenant_id="t2",name="Two")]);db.flush()
    db.add_all([BusinessAccount(id=1,tenant_id="t1",name="One",status="active"),BusinessAccount(id=2,tenant_id="t1",name="Two",status="active"),BusinessAccount(id=3,tenant_id="t2",name="Other",status="active")]);db.commit()
    assets=[]
    for index,(bid,tid) in enumerate([(1,"t1"),(1,"t1"),(2,"t1"),(3,"t2")]):
        path=tmp_path/f"{index}.png";Image.new("RGB",(20,20),["blue","red","green","yellow"][index]).save(path)
        assets.append(AssetService(db).register_file(tenant_id=tid,business_account_id=bid,source_path=path,source="logo"))
    app=FastAPI();app.include_router(router)
    app.dependency_overrides[get_tenant_context]=lambda:TenantContext("t1")
    app.dependency_overrides[get_db]=lambda:db
    with TestClient(app) as client:yield client,db,assets
    db.close();engine.dispose()


def payload(logo):
    return {"business":{"business_name":"My shop","category":"Retail","description":"Local products","website":"https://shop.example","country":"India","city":"Delhi","pincode":"110001"},
      "brand":{"brand_name":"My shop","brand_description":"Local products","industry":"Retail","tone":"Friendly","website":"https://shop.example","phone":"+91 98765 43210","logo_asset_id":logo,"primary_color":"#123456","secondary_color":"#654321","accent_color":"#abcdef"},
      "audience":{"name":"Customers","description":"Nearby shoppers","age_groups":["25-34","55+"],"genders":["All"],"locations":["Delhi"]},
      "preferences":{"primary_goal":"Calls","secondary_goals":["Awareness"],"timezone":"Asia/Kolkata","preferred_posting_time":"11:30","posting_frequency":"weekdays","approval_mode":"human_intervention"}}


def test_save_reload_and_replace_logo(setup):
    client,db,assets=setup
    data=payload(assets[0].id)
    response=client.put("/business/settings?business_account_id=1",json=data)
    assert response.status_code==200,response.text
    first=response.json();assert first["brand"]["phone"]=="+919876543210"
    db.expire_all()
    reloaded=client.get("/business/settings?business_account_id=1").json()
    assert reloaded["business"]["pincode"]=="110001"
    assert reloaded["brand"]["accent_color"]=="#abcdef"
    assert reloaded["audiences"][0]["age_groups"]==["25-34","55+"]
    assert reloaded["audiences"][0]["age_min"]==25
    assert reloaded["audiences"][0]["age_max"]==120
    assert reloaded["preferences"]["posting_frequency"]=="weekdays"
    data["audience_id"]=reloaded["audiences"][0]["id"]
    data["brand"]["logo_asset_id"]=assets[1].id;data["business"]["city"]="Mumbai"
    assert client.put("/business/settings?business_account_id=1",json=data).status_code==200
    db.expire_all();after=client.get("/business/settings?business_account_id=1").json()
    assert after["brand"]["logo_asset_id"]==assets[1].id
    assert after["business"]["city"]=="Mumbai"
    assert assets[0].status!="deleted"
    assert len(after["audiences"])==1
    assert after["logo_url"] and after["logo_url"]!=first["logo_url"]
    assert db.get(BusinessAccount,1).name=="My shop"


@pytest.mark.parametrize("phone",[None,"","123","9876543210","+0123456789","not a phone"])
def test_invalid_mobile_no_write(setup,phone):
    client,db,assets=setup;data=payload(assets[0].id);data["brand"]["phone"]=phone
    assert client.put("/business/settings?business_account_id=1",json=data).status_code==422
    assert db.scalar(select(BusinessProfile)) is None


def test_foreign_business_logo_and_audience_rejected(setup):
    client,db,assets=setup
    assert client.get("/business/settings?business_account_id=3").status_code==404
    for asset in assets[2:]:
        assert client.put("/business/settings?business_account_id=1",json=payload(asset.id)).status_code==422
    assert db.scalar(select(BusinessProfile)) is None
    data=payload(assets[2].id)
    assert client.put("/business/settings?business_account_id=2",json=data).status_code==200
    aid=client.get("/business/settings?business_account_id=2").json()["audiences"][0]["id"]
    data=payload(assets[0].id);data["audience_id"]=aid
    assert client.put("/business/settings?business_account_id=1",json=data).status_code==422
    assert db.scalar(select(BusinessProfile).where(BusinessProfile.business_account_id==1)) is None


def test_transaction_rolls_back_all_changes(setup,monkeypatch):
    client,db,assets=setup;data=payload(assets[0].id)
    def fail():raise RuntimeError("Database unavailable")
    with monkeypatch.context() as patch:
        patch.setattr(db,"commit",fail)
        with pytest.raises(RuntimeError):client.put("/business/settings?business_account_id=1",json=data)
    assert db.scalar(select(BusinessProfile)) is None
    assert db.scalar(select(BrandProfile)) is None
    assert db.scalar(select(TargetAudience)) is None
    assert db.get(BusinessAccount,1).name=="One"


def test_legacy_missing_mobile_can_load_but_requires_completion(setup):
    client,db,assets=setup
    db.add(BrandProfile(tenant_id="t1",business_account_id=1,brand_name="Old",industry="Retail",tone="Friendly",phone=None,logo_asset_id=assets[0].id));db.commit()
    assert client.get("/business/settings?business_account_id=1").json()["brand"]["phone"] is None


def test_missing_audience_selection_does_not_duplicate(setup):
    client,db,assets=setup;data=payload(assets[0].id)
    assert client.put("/business/settings?business_account_id=1",json=data).status_code==200
    assert client.put("/business/settings?business_account_id=1",json=data).status_code==422
    assert len(client.get("/business/settings?business_account_id=1").json()["audiences"])==1


@pytest.mark.parametrize("field,value", [("timezone","Invalid/Timezone"),("preferred_posting_time","29:00"),("posting_frequency","custom")])
def test_invalid_schedule_cannot_break_worker_settings(setup,field,value):
    client,db,assets=setup;data=payload(assets[0].id);data["preferences"][field]=value
    assert client.put("/business/settings?business_account_id=1",json=data).status_code==422
    assert db.scalar(select(MarketingPreferences)) is None


def test_new_brand_requires_mobile_but_legacy_logo_patch_is_allowed():
    from pydantic import ValidationError
    from app.schemas.brand import BrandProfileCreate, BrandProfileUpdate
    with pytest.raises(ValidationError):BrandProfileCreate(business_account_id=1,brand_name="Shop",industry="Retail",tone="Friendly")
    assert BrandProfileUpdate(logo_asset_id="asset").model_dump(exclude_unset=True)=={"logo_asset_id":"asset"}


def test_added_fields_migration_preserves_rows_and_can_repeat():
    import importlib.util
    from alembic.migration import MigrationContext
    from alembic.operations import Operations
    from sqlalchemy import inspect, text
    engine=create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        for table in ("business_profiles","brand_profiles","target_audiences"):
            connection.execute(text(f"CREATE TABLE {table} (id INTEGER PRIMARY KEY, description TEXT)"))
            connection.execute(text(f"INSERT INTO {table} (id,description) VALUES (1,'keep me')"))
        path=Path(__file__).resolve().parents[1]/"alembic/versions/27a1c72e9d10_add_business_profile_edit_fields.py"
        spec=importlib.util.spec_from_file_location("edit_migration",path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        with Operations.context(MigrationContext.configure(connection)):
            module.upgrade();module.upgrade()
        for table,field in [("business_profiles","pincode"),("brand_profiles","accent_color"),("target_audiences","age_groups")]:
            assert field in {c["name"] for c in inspect(connection).get_columns(table)}
            assert connection.execute(text(f"SELECT description FROM {table} WHERE id=1")).scalar_one()=="keep me"
    engine.dispose()
