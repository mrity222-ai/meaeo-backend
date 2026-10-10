import asyncio

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.api.public_marketing import router
from app.api.oauth import meta_deletion_status
from app.database.models import StorageDocument
from app.database.session import get_db


@pytest.fixture
def client_db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    StorageDocument.__table__.create(engine)
    with Session(engine) as db:
        api = FastAPI()
        api.include_router(router)
        api.dependency_overrides[get_db] = lambda: db
        with TestClient(api) as client:
            yield client, db
    engine.dispose()


def test_contact_receipt_is_persisted_and_not_a_delivery_claim(client_db):
    client, db = client_db
    response = client.post("/public/contact", json={"name": " Test ", "email": "Owner@Example.com",
        "subject": "Help", "message": "Please help with my business", "consent": True})
    assert response.status_code == 201
    result = response.json()
    record = db.get(StorageDocument, f"marketing/contact/{result['reference']}")
    assert record.data["name"] == "Test"
    assert record.data["email"] == "owner@example.com"
    assert result["status"] == "received"


@pytest.mark.parametrize("extra", [{"email": "invalid"}, {"consent": False}, {"website": "spam"}, {"message": "   "}])
def test_invalid_contact_is_rejected(client_db, extra):
    client, db = client_db
    body = {"name": "Test", "email": "a@example.com", "subject": "Help", "message": "A real enquiry message", "consent": True, **extra}
    assert client.post("/public/contact", json=body).status_code == 422
    assert not db.scalars(select(StorageDocument).where(StorageDocument.storage_key.like("marketing/contact/%"))).all()


def test_newsletter_is_idempotent(client_db):
    client, db = client_db
    for _ in range(2):
        assert client.post("/public/newsletter", json={"email": "a@example.com", "consent": True}).status_code == 200
    assert len(db.scalars(select(StorageDocument).where(StorageDocument.storage_key.like("marketing/newsletter/%"))).all()) == 1


def test_submission_rate_limit(client_db):
    client, _ = client_db
    for _ in range(10):
        assert client.post("/public/newsletter", json={"email": "a@example.com", "consent": True}).status_code == 200
    assert client.post("/public/newsletter", json={"email": "b@example.com", "consent": True}).status_code == 429


def test_unknown_deletion_never_reports_completed(client_db):
    _, db = client_db
    with pytest.raises(HTTPException) as error:
        asyncio.run(meta_deletion_status("unknown", db))
    assert error.value.status_code == 404


def test_deletion_returns_recorded_status_only(client_db):
    _, db = client_db
    db.add(StorageDocument(storage_key="oauth/deletion/known", data={"confirmation_code": "known", "status": "PROCESSING", "message": "Cleanup pending"}))
    db.commit()
    assert asyncio.run(meta_deletion_status("known", db))["status"] == "PROCESSING"


def test_admin_can_read_saved_enquiries(client_db):
    from app.api.dependencies import get_current_admin
    client, db = client_db
    client.app.dependency_overrides[get_current_admin] = lambda: object()
    db.add(StorageDocument(storage_key="marketing/contact/WEB-TEST", data={"reference": "WEB-TEST", "created_at": "2026-10-09T00:00:00+00:00"}))
    db.commit()
    response = client.get("/public/submissions")
    assert response.status_code == 200
    assert response.json()[0]["reference"] == "WEB-TEST"


def test_callback_records_processing_not_unverified_completion(client_db, monkeypatch):
    from types import SimpleNamespace
    from pydantic import SecretStr
    from app.api import oauth
    _, db = client_db
    monkeypatch.setattr(oauth, "settings", SimpleNamespace(META_APP_SECRET=SecretStr("test-secret")))
    monkeypatch.setattr(oauth, "parse_signed_request", lambda **kwargs: {"user_id": "test-meta-user"})
    # This test has no live connected accounts; the callback still records a real request.
    monkeypatch.setattr(db, "scalars", lambda statement: SimpleNamespace(all=lambda: []))
    result = asyncio.run(oauth.meta_data_deletion_callback("signed-test-request", db))
    code = result["confirmation_code"]
    assert "/data-deletion?code=" in result["url"]
    assert asyncio.run(oauth.meta_deletion_status(code, db))["status"] == "PROCESSING"
