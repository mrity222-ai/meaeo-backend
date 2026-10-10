import asyncio
import json
import re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

import pytest
from cryptography.fernet import Fernet
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.models.config import settings, runtime_settings
from app.services import admin_settings_service as service
from app.api import admin_settings as routes


@pytest.fixture(autouse=True)
def isolated_settings(tmp_path, monkeypatch):
    token = runtime_settings.set(None)
    monkeypatch.setattr(service, "STORE_PATH", tmp_path / "settings/runtime.enc")
    monkeypatch.setattr(settings, "CREDENTIAL_ENCRYPTION_KEY", SecretStr(Fernet.generate_key().decode()))
    monkeypatch.setattr(settings, "APP_ENV", "development")
    monkeypatch.setattr(settings, "RESEARCH_PROVIDERS", "tavily")
    for field in ("TAVILY_ENABLED", "FIRECRAWL_ENABLED", "SEO_ENABLED"):
        monkeypatch.setattr(settings, field, None)
    for name in service.PROVIDER_KEYS.values():
        monkeypatch.setattr(settings, name, SecretStr("legacy-test-key"))
    monkeypatch.setattr(settings, "TEXT_MODEL_PROVIDER", "huggingface")
    monkeypatch.setattr(settings, "TEXT_MODEL_ALIAS", "default_chat")
    monkeypatch.setattr(settings, "IMAGE_MODEL_PROVIDER", "huggingface")
    monkeypatch.setattr(settings, "IMAGE_MODEL", "example/test-image-model")
    yield
    runtime_settings.reset(token)


def rev(section):
    return service.describe_sections()["sections"][section]["revision"]


def save(section, changes, **kwargs):
    return service.save_section(section, changes, rev(section), **kwargs)


def verified_save(section, changes, remove_keys=None):
    candidate = service.prepare_test(section, changes, remove_keys)
    proof = service.issue_verification(section, candidate)
    return save(section, changes, verification_token=proof, remove_keys=remove_keys)


def test_sections_separate_text_image_and_research():
    sections = service.describe_sections()["sections"]
    assert set(sections) == {"text", "image", "tavily", "firecrawl", "seo", "meta", "google", "linkedin", "email", "payments", "security"}
    assert set(sections["text"]["keys"]).isdisjoint(sections["image"]["keys"])
    assert sections["text"]["values"]["TEXT_HF_TOKEN"] == "••••••••"
    assert "legacy-test-key" not in json.dumps(sections)


def test_save_image_does_not_overwrite_text_or_environment():
    verified_save("image", {"IMAGE_MODEL_PROVIDER": "openai", "IMAGE_MODEL": "image-test-model", "IMAGE_OPENAI_API_KEY": "image-only-test-key"})
    assert b"image-only-test-key" not in service.STORE_PATH.read_bytes()
    with service.settings_scope():
        assert service.provider_api_key("image", "openai") == "image-only-test-key"
        assert service.provider_api_key("text", "openai") == "legacy-test-key"
        assert settings.IMAGE_MODEL_PROVIDER == "openai"
        assert settings.TEXT_MODEL_PROVIDER == "huggingface"
    assert settings.IMAGE_MODEL_PROVIDER == "huggingface"
    assert settings.OPENAI_API_KEY.get_secret_value() == "legacy-test-key"


def test_blank_and_masked_key_preserve_working_key():
    save("tavily", {"TAVILY_API_KEY": "research-only-test-key"})
    save("tavily", {"TAVILY_API_KEY": ""})
    save("tavily", {"TAVILY_API_KEY": "   "})
    save("tavily", {"TAVILY_API_KEY": "••••••••"})
    with service.settings_scope():
        assert settings.TAVILY_API_KEY.get_secret_value() == "research-only-test-key"


@pytest.mark.parametrize("section,changes", [
    ("image", {"TEXT_OPENAI_API_KEY": "test"}), ("payments", {"JWT_SECRET_KEY": "test"}),
    ("meta", {"DATABASE_URL": "sqlite:///test"}), ("email", {"SMTP_PORT": "bad"}),
    ("email", {"SMTP_PORT": "70000"}), ("email", {"SMTP_USE_TLS": "maybe"}),
    ("meta", {"META_REDIRECT_URI": "javascript:bad"}), ("meta", {"META_APP_ID": "a\nJWT_SECRET_KEY=x"}),
    ("text", {"TEXT_MODEL_PROVIDER": "unknown"}), ("image", {"IMAGE_MODEL_PROVIDER": "fal"}),
    ("text", {"TEXT_MODEL_ALIAS": "space in model"}), ("security", {"SUPER_ADMIN_PIN": "12"}),
    ("security", {"SUPER_ADMIN_EMAIL": "invalid"}),
])
def test_invalid_or_cross_section_input_never_writes(section, changes):
    with pytest.raises(HTTPException) as error:
        save(section, changes)
    assert error.value.status_code == 422
    assert not service.STORE_PATH.exists()


def test_activation_requires_server_test_proof():
    changes = {"IMAGE_MODEL_PROVIDER": "openai", "IMAGE_MODEL": "image-test-model"}
    with pytest.raises(HTTPException, match="Test the selected"):
        save("image", changes)
    assert not service.STORE_PATH.exists()


def test_proof_is_bound_to_section_key_and_model():
    changes = {"IMAGE_MODEL_PROVIDER": "openai", "IMAGE_MODEL": "image-test-model"}
    proof = service.issue_verification("image", service.prepare_test("image", changes))
    with pytest.raises(HTTPException):
        save("image", {**changes, "IMAGE_OPENAI_API_KEY": "different-test-key"}, verification_token=proof)
    with pytest.raises(HTTPException):
        save("image", {**changes, "IMAGE_MODEL": "different-model"}, verification_token=proof)
    verified_save("image", changes)
    with service.settings_scope():
        assert settings.IMAGE_MODEL == "image-test-model"


def test_expired_proof_rejected(monkeypatch):
    import cryptography.fernet
    changes = {"TEXT_MODEL_PROVIDER": "openai", "TEXT_MODEL_ALIAS": "text-test-model"}
    candidate = service.prepare_test("text", changes)
    proof = service._cipher().encrypt_at_time(service._fingerprint("text", candidate).encode(), 1).decode()
    with pytest.raises(HTTPException):
        save("text", changes, verification_token=proof)


def test_active_key_removal_rejected_inactive_removal_is_explicit():
    with pytest.raises(HTTPException):
        save("image", {}, remove_keys=["IMAGE_HF_TOKEN"])
    verified_save("image", {"IMAGE_MODEL_PROVIDER": "openai", "IMAGE_MODEL": "image-test-model"}, ["IMAGE_HF_TOKEN"])
    with service.settings_scope():
        assert service.provider_api_key("image", "huggingface") == ""
        assert service.provider_api_key("text", "huggingface") == "legacy-test-key"
    assert not service.describe_sections()["sections"]["image"]["configured"]["IMAGE_HF_TOKEN"]


def test_concurrent_same_section_is_conflict_unrelated_section_preserved():
    old_rev = rev("tavily")
    save("tavily", {"TAVILY_API_KEY": "first-test-key"})
    with pytest.raises(HTTPException) as error:
        service.save_section("tavily", {"TAVILY_API_KEY": "stale-test-key"}, old_rev)
    assert error.value.status_code == 409
    revisions = {s: rev(s) for s in ("firecrawl", "seo")}
    with ThreadPoolExecutor(2) as pool:
        list(pool.map(lambda s: service.save_section(s, {"FIRECRAWL_API_KEY": "crawler-test-key"} if s == "firecrawl" else {"DATAFORSEO_LOGIN": "seo-test-login"}, revisions[s]), revisions))
    assert service._load()["FIRECRAWL_API_KEY"] == "crawler-test-key"
    assert service._load()["DATAFORSEO_LOGIN"] == "seo-test-login"


def test_current_scope_keeps_snapshot_next_scope_loads_saved_values():
    save("tavily", {"TAVILY_API_KEY": "before-test-key"})
    with service.settings_scope():
        save("tavily", {"TAVILY_API_KEY": "after-test-key"})
        assert settings.TAVILY_API_KEY.get_secret_value() == "before-test-key"
    with service.settings_scope():
        assert settings.TAVILY_API_KEY.get_secret_value() == "after-test-key"


def test_atomic_write_failure_keeps_previous_settings(monkeypatch):
    save("tavily", {"TAVILY_API_KEY": "previous-test-key"})
    def fail(*args):
        raise OSError("test filesystem failure")
    monkeypatch.setattr(service.os, "replace", fail)
    with pytest.raises(OSError):
        save("tavily", {"TAVILY_API_KEY": "replacement-test-key"})
    assert service._load()["TAVILY_API_KEY"] == "previous-test-key"
    assert not list(service.STORE_PATH.parent.glob("*.tmp"))


def test_corrupted_settings_fail_closed():
    service.STORE_PATH.parent.mkdir(parents=True)
    service.STORE_PATH.write_bytes(b"corrupt")
    with pytest.raises(HTTPException) as error:
        with service.settings_scope():
            pass
    assert error.value.status_code == 503


def test_audit_has_names_and_time_no_secret_values():
    save("tavily", {"TAVILY_API_KEY": "audit-test-key"})
    audit = service._load()["__audit"][-1]
    assert audit["section"] == "tavily" and audit["updated_keys"] == ["TAVILY_API_KEY"]
    assert audit["saved_at"] and "audit-test-key" not in json.dumps(audit)


def test_runtime_preserves_existing_provider_credential_types():
    save("seo", {"DATAFORSEO_LOGIN": "seo-test-login", "DATAFORSEO_PASSWORD": "seo-test-password"})
    save("meta", {"META_APP_SECRET": "meta-test-secret"})
    save("linkedin", {"LINKEDIN_CLIENT_SECRET": "linkedin-test-secret"})
    with service.settings_scope():
        from app.clients.dataforseo import DataForSEOClient
        assert DataForSEOClient().auth.password == "seo-test-password"
        assert settings.META_APP_SECRET == "meta-test-secret"
        assert settings.LINKEDIN_CLIENT_SECRET.get_secret_value() == "linkedin-test-secret"


def test_admin_credentials_cannot_be_removed():
    with pytest.raises(HTTPException):
        save("security", {}, remove_keys=["SUPER_ADMIN_PASSWORD"])


def test_actual_request_middleware_loads_snapshot():
    from app.api.main import RuntimeSettingsMiddleware
    app = FastAPI()
    app.add_middleware(RuntimeSettingsMiddleware)
    @app.get("/test-snapshot")
    def get_snapshot():
        return {"provider": settings.IMAGE_MODEL_PROVIDER, "scoped": runtime_settings.get() is not None}
    client = TestClient(app)
    assert client.get("/test-snapshot").json() == {"provider": "huggingface", "scoped": True}
    verified_save("image", {"IMAGE_MODEL_PROVIDER": "openai", "IMAGE_MODEL": "image-test-model"})
    assert client.get("/test-snapshot").json() == {"provider": "openai", "scoped": True}
    assert runtime_settings.get() is None


def test_failed_provider_test_keeps_working_settings_and_redacts_errors(monkeypatch):
    async def fail(*args):
        raise RuntimeError("provider request contained secret-test-key")
    monkeypatch.setattr(routes, "check_connection", fail)
    response = asyncio.run(routes.test_section("image", routes.SectionUpdate(changes={"IMAGE_MODEL_PROVIDER": "openai", "IMAGE_MODEL": "image-test-model"})))
    assert not response["success"] and "secret-test-key" not in response["message"]
    assert "verification_token" not in response and not service.STORE_PATH.exists()


def test_section_api_auth_and_activation_flow(monkeypatch):
    app = FastAPI()
    app.include_router(routes.router)
    client = TestClient(app)
    assert client.get("/admin/settings/sections").status_code == 401
    app.dependency_overrides[routes.get_current_admin] = lambda: "test-admin"
    async def success(*args):
        return "verified fake provider"
    monkeypatch.setattr(routes, "check_connection", success)
    changes = {"TEXT_MODEL_PROVIDER": "openai", "TEXT_MODEL_ALIAS": "text-test-model", "TEXT_OPENAI_API_KEY": "text-test-key"}
    proof = client.post("/admin/settings/sections/text/test", json={"changes": changes}).json()["verification_token"]
    response = client.post("/admin/settings/sections/text", json={"changes": changes, "revision": rev("text"), "verification_token": proof})
    assert response.status_code == 200
    result = client.get("/admin/settings/sections").json()
    assert result["sections"]["text"]["active_provider"] == "openai"
    assert "text-test-key" not in json.dumps(result)


def test_frontend_settings_urls_match_mounted_backend_routes():
    from app.api.main import app
    frontend = Path(__file__).resolve().parents[1] / "autonomous-marketing-frontend-main"
    page = (frontend / "app/admin/settings/page.tsx").read_text(encoding="utf-8-sig")
    component = (frontend / "components/admin/api-settings-section.tsx").read_text(encoding="utf-8")
    mounted = {route.path: route.methods for route in app.routes if hasattr(route, "methods")}
    load_url = re.search(r'apiRequest.*?\("([^"]+settings/sections)"\)', page, re.S).group(1)
    assert "GET" in mounted[load_url]
    for url in re.findall(r'`(/[^`]*settings/sections/\$\{id\}[^`]*)`', component):
        assert "POST" in mounted[url.replace("${id}", "{section}")]
    client = TestClient(app)
    assert client.get(load_url).status_code == 401


def test_worker_scope_refresh_and_fail_closed():
    from app.workers.celery_app import RuntimeSettingsTask, celery_app
    class TestTask(RuntimeSettingsTask):
        def run(self):
            return settings.TAVILY_API_KEY.get_secret_value()
    TestTask.bind(celery_app)
    save("tavily", {"TAVILY_API_KEY": "worker-first-test-key"})
    assert TestTask()() == "worker-first-test-key"
    save("tavily", {"TAVILY_API_KEY": "worker-next-test-key"})
    assert TestTask()() == "worker-next-test-key"
    assert runtime_settings.get() is None
    service.STORE_PATH.write_bytes(b"corrupt")
    with pytest.raises(HTTPException):
        TestTask()()


def test_firecrawl_uses_unmasked_key_from_saved_override():
    from app.clients.firecrawl import FirecrawlClient
    save("firecrawl", {"FIRECRAWL_API_KEY": "crawler-test-secret"})
    with service.settings_scope():
        assert FirecrawlClient().headers["Authorization"] == "Bearer crawler-test-secret"


def test_research_enable_is_independent_of_key_save_and_other_sections():
    from app.research.registry import ResearchRegistry
    save("firecrawl", {"FIRECRAWL_API_KEY": "crawler-test-secret"})
    with service.settings_scope():
        assert ResearchRegistry.selected_names() == ["tavily"]
        save("firecrawl", {"FIRECRAWL_ENABLED": True})
        assert ResearchRegistry.selected_names() == ["tavily"]
    with service.settings_scope():
        assert set(ResearchRegistry.scoped_providers()) == {"tavily", "firecrawl"}
    save("tavily", {"TAVILY_ENABLED": False})
    with service.settings_scope():
        assert list(ResearchRegistry.scoped_providers()) == ["firecrawl"]
    save("firecrawl", {"FIRECRAWL_ENABLED": False})
    with service.settings_scope():
        assert ResearchRegistry.providers() == []


def test_existing_research_selection_is_preserved(monkeypatch):
    monkeypatch.setattr(settings, "RESEARCH_PROVIDERS", "firecrawl,seo")
    with service.settings_scope():
        from app.research.registry import ResearchRegistry
        assert set(ResearchRegistry.selected_names()) == {"firecrawl", "seo"}
    data = service.describe_sections()["sections"]
    assert not data["tavily"]["values"]["TAVILY_ENABLED"]
    assert data["seo"]["values"]["SEO_ENABLED"]


def test_enabling_research_requires_credentials(monkeypatch):
    monkeypatch.setattr(settings, "FIRECRAWL_API_KEY", None)
    with pytest.raises(HTTPException):
        save("firecrawl", {"FIRECRAWL_ENABLED": True})
    assert not service.STORE_PATH.exists()


@pytest.mark.parametrize("key,value", [
    ("META_REDIRECT_URI", "http://localhost:8000/oauth/callback/linkedin"),
    ("GOOGLE_BUSINESS_REDIRECT_URI", "http://localhost:8000/wrong"),
    ("LINKEDIN_REDIRECT_URI", "http://localhost:8000/oauth/linkedin/callback?secret=test"),
])
def test_callback_cannot_point_to_wrong_platform_or_path(key, value):
    section = {"META_REDIRECT_URI": "meta", "GOOGLE_BUSINESS_REDIRECT_URI": "google", "LINKEDIN_REDIRECT_URI": "linkedin"}[key]
    with pytest.raises(HTTPException):
        save(section, {key: value})


def test_valid_local_callback_can_be_saved():
    save("google", {"GOOGLE_BUSINESS_REDIRECT_URI": "http://127.0.0.1:8000/oauth/google-business/callback"})
    with service.settings_scope():
        assert settings.GOOGLE_BUSINESS_REDIRECT_URI.endswith("/oauth/google-business/callback")


def test_status_shows_default_admin_and_remote_local_callback(monkeypatch):
    for key in ("SUPER_ADMIN_PASSWORD", "SUPER_ADMIN_PIN"):
        monkeypatch.setattr(settings, key, type(settings).model_fields[key].default)
    monkeypatch.setattr(settings, "LINKEDIN_REDIRECT_URI", "https://example.com/oauth/linkedin/callback")
    sections = service.describe_sections()["sections"]
    assert len(sections["security"]["warnings"]) == 2
    assert sections["linkedin"]["warnings"]
    for value in (settings.SUPER_ADMIN_PASSWORD, settings.SUPER_ADMIN_PIN):
        assert value not in json.dumps(sections["security"]["warnings"])


def test_production_blocks_default_credentials_and_local_callbacks(monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "production")
    for key in ("SUPER_ADMIN_PASSWORD", "SUPER_ADMIN_PIN"):
        monkeypatch.setattr(settings, key, type(settings).model_fields[key].default)
    with pytest.raises(ValueError) as error:
        settings.validate_production_config()
    assert "SUPER_ADMIN_PASSWORD" in str(error.value) and "SUPER_ADMIN_PIN" in str(error.value)
    with pytest.raises(HTTPException):
        save("linkedin", {"LINKEDIN_REDIRECT_URI": "https://localhost/oauth/linkedin/callback"})


def test_valid_production_configuration_is_accepted(monkeypatch):
    values = {"APP_ENV": "production", "PUBLISH_MODE": "production", "PUBLISH_PROVIDER": "facebook",
              "STORAGE_BACKEND": "database", "ASSET_PUBLIC_BASE_URL": "https://assets.example.com",
              "SUPER_ADMIN_PASSWORD": "replacement-test-password", "SUPER_ADMIN_PIN": "123789",
              "META_APP_ID": "test-meta", "GOOGLE_CLIENT_ID": "test-google", "LINKEDIN_CLIENT_ID": "test-linkedin",
              "META_REDIRECT_URI": "https://api.example.com/api/v1/oauth/callback/meta",
              "GOOGLE_BUSINESS_REDIRECT_URI": "https://api.example.com/oauth/google-business/callback",
              "LINKEDIN_REDIRECT_URI": "https://api.example.com/oauth/linkedin/callback"}
    for key, value in values.items():
        monkeypatch.setattr(settings, key, value)
    settings.validate_production_config()
