"""Section-scoped encrypted settings, shared by API/worker at operation boundaries."""
import hashlib
import json
import os
import re
import tempfile
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from typing import get_args

from cryptography.fernet import Fernet, InvalidToken
from filelock import FileLock
from fastapi import HTTPException
from pydantic import SecretStr

from app.models.config import settings, runtime_settings

ROOT = Path(__file__).resolve().parents[2]
STORE_PATH = ROOT / "data/settings/runtime.enc"
PROVIDER_KEYS = {"huggingface": "HF_TOKEN", "openai": "OPENAI_API_KEY",
                 "gemini": "GEMINI_API_KEY", "anthropic": "ANTHROPIC_API_KEY",
                 "stability": "STABILITY_API_KEY"}
TEXT_PROVIDERS = ("huggingface", "openai", "gemini", "anthropic", "ollama")
IMAGE_PROVIDERS = ("huggingface", "openai", "gemini", "stability")


def ai_keys(kind, providers):
    return [f"{kind.upper()}_{PROVIDER_KEYS[p]}" for p in providers if p in PROVIDER_KEYS]


SECTIONS = {
    "text": {"title": "Text Generation", "description": "Captions, planning and marketing copy. One active text provider.",
             "keys": ["TEXT_MODEL_PROVIDER", "TEXT_MODEL_ALIAS", *ai_keys("text", TEXT_PROVIDERS)], "providers": TEXT_PROVIDERS},
    "image": {"title": "Image Generation", "description": "AI images and backgrounds. Independent of text generation.",
              "keys": ["IMAGE_MODEL_PROVIDER", "IMAGE_MODEL", *ai_keys("image", IMAGE_PROVIDERS)], "providers": IMAGE_PROVIDERS},
    "tavily": {"title": "Live Research — Tavily", "description": "Search the web for business and market research.", "keys": ["TAVILY_ENABLED", "TAVILY_API_KEY"]},
    "firecrawl": {"title": "Website Research — Firecrawl", "description": "Extract business and competitor website content.", "keys": ["FIRECRAWL_ENABLED", "FIRECRAWL_API_KEY"]},
    "seo": {"title": "SEO — DataForSEO", "description": "Keyword search volume and intent.", "keys": ["SEO_ENABLED", "DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD"]},
    "meta": {"title": "Facebook / Instagram", "description": "Meta OAuth, publishing and analytics. Reconnect affected accounts after credential changes.",
             "keys": ["META_APP_ID", "META_APP_SECRET", "META_REDIRECT_URI", "META_CONFIG_ID", "META_API_VERSION"]},
    "google": {"title": "Google Business", "description": "Business profile, publishing, reviews and performance. Frontend Google login client changes require a rebuild.",
               "keys": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "GOOGLE_BUSINESS_REDIRECT_URI"]},
    "linkedin": {"title": "LinkedIn", "description": "Company Page connection, publishing and analytics. Reconnect after credential changes.",
                 "keys": ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LINKEDIN_REDIRECT_URI", "LINKEDIN_OAUTH_SCOPES", "LINKEDIN_ANALYTICS_API_VERSION"]},
    "email": {"title": "Email — SMTP / Resend", "description": "OTP and transactional emails. One active email provider.",
              "keys": ["EMAIL_PROVIDER", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_USE_TLS", "RESEND_API_KEY", "EMAIL_FROM", "EMAIL_FROM_NAME"]},
    "payments": {"title": "Payments — Razorpay", "description": "Subscriptions and signed webhooks. Match the webhook secret with Razorpay configuration.",
                 "keys": ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"]},
    "security": {"title": "Admin Access", "description": "Admin login credentials. Changing email may require signing in again.",
                 "keys": ["SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD", "SUPER_ADMIN_PIN"]},
}
SECRET_KEYS = {k for spec in SECTIONS.values() for k in spec["keys"]
               if any(marker in k for marker in ("API_KEY", "TOKEN", "SECRET", "PASSWORD", "PIN"))}
SECRET_KEYS.discard("RAZORPAY_KEY_ID")


def _cipher():
    # Never rotate the encryption key through this settings interface.
    return Fernet(settings.CREDENTIAL_ENCRYPTION_KEY.get_secret_value().encode())


def _load():
    if not STORE_PATH.exists():
        return {}
    try:
        data = json.loads(_cipher().decrypt(STORE_PATH.read_bytes()))
        if not isinstance(data, dict):
            raise ValueError()
        return data
    except (InvalidToken, ValueError, OSError):
        raise HTTPException(503, "Saved settings cannot be read. Check the shared settings volume and encryption key.") from None


def _write(data):
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=STORE_PATH.parent, prefix="settings-", suffix=".tmp")
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(_cipher().encrypt(json.dumps(data).encode()))
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(tmp, STORE_PATH)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def raw(value):
    return value.get_secret_value() if hasattr(value, "get_secret_value") else value


def _effective(data, key):
    if key in data:
        return data[key]
    for kind in ("TEXT", "IMAGE"):
        if key.startswith(kind + "_") and key[len(kind) + 1:] in PROVIDER_KEYS.values():
            return raw(getattr(settings, key[len(kind) + 1:], None)) or ""
    if key in ("TAVILY_ENABLED", "FIRECRAWL_ENABLED", "SEO_ENABLED"):
        configured = getattr(settings, key, None)
        if configured is not None:
            return configured
        return key.removesuffix("_ENABLED").lower() in {name.strip().lower() for name in settings.RESEARCH_PROVIDERS.split(",")}
    return raw(getattr(settings, key, ""))


def _revision(section, data):
    # Hash persisted section state, not secrets returned to the browser.
    return hashlib.sha256(json.dumps({k: data[k] for k in SECTIONS[section]["keys"] if k in data}, sort_keys=True).encode()).hexdigest()


def describe_sections():
    data = _load()
    result = {}
    for section, spec in SECTIONS.items():
        values, configured = {}, {}
        for key in spec["keys"]:
            value = _effective(data, key)
            configured[key] = bool(value)
            values[key] = "••••••••" if key in SECRET_KEYS and value else value
        active = values.get("TEXT_MODEL_PROVIDER") or values.get("IMAGE_MODEL_PROVIDER") or values.get("EMAIL_PROVIDER")
        warnings = []
        if section in ("tavily", "firecrawl", "seo"):
            active = "enabled" if values[f"{section.upper()}_ENABLED"] else "disabled"
        if section == "security":
            for key in ("SUPER_ADMIN_PASSWORD", "SUPER_ADMIN_PIN"):
                if _effective(data, key) == type(settings).model_fields[key].default:
                    warnings.append(f"{key} still uses its built-in default. Enter your own credential before production.")
        callback_keys = {"meta": "META_REDIRECT_URI", "google": "GOOGLE_BUSINESS_REDIRECT_URI", "linkedin": "LINKEDIN_REDIRECT_URI"}
        if section in callback_keys:
            key = callback_keys[section]
            uri = urlparse(str(values.get(key) or ""))
            if settings.APP_ENV.lower() not in ("production", "prod") and uri.hostname and uri.hostname not in ("localhost", "127.0.0.1", "::1"):
                warnings.append("This callback points to a deployed server. For local OAuth testing, enter this local backend's callback URL and register exactly the same URL in the provider console.")
        result[section] = {**spec, "values": values, "configured": configured,
                           "active_provider": active, "warnings": warnings, "revision": _revision(section, data)}
    return {"status": "ok", "sections": result, "storage": "encrypted_shared_settings",
            "apply_mode": "next_request_or_worker_task"}


def _normalize(section, changes):
    if section not in SECTIONS:
        raise HTTPException(404, "Unknown settings section.")
    if not isinstance(changes, dict) or set(changes) - set(SECTIONS[section]["keys"]):
        raise HTTPException(422, "Only fields belonging to this section may be saved.")
    updates = {}
    for key, value in changes.items():
        if value is None or value == "" or (isinstance(value, str) and ("••••" in value or "****" in value)):
            continue
        if not isinstance(value, (str, bool, int)):
            raise HTTPException(422, f"Invalid value for {key}.")
        value = value.strip() if isinstance(value, str) else value
        if value == "":
            continue
        if isinstance(value, str) and (len(value) > 4096 or any(c in value for c in ("\n", "\r", "\x00"))):
            raise HTTPException(422, f"Invalid value for {key}.")
        if key == "SMTP_PORT":
            try:
                value = int(value)
                if not 1 <= value <= 65535:
                    raise ValueError()
            except (ValueError, TypeError):
                raise HTTPException(422, "SMTP port must be between 1 and 65535.") from None
        if key == "SMTP_USE_TLS" or key in ("TAVILY_ENABLED", "FIRECRAWL_ENABLED", "SEO_ENABLED"):
            if str(value).lower() not in ("true", "false", "1", "0"):
                raise HTTPException(422, f"{key} must be true or false.")
            value = str(value).lower() in ("true", "1")
        if key.endswith("REDIRECT_URI"):
            parsed = urlparse(str(value))
            if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password:
                raise HTTPException(422, f"{key} must be an HTTP(S) URL.")
            if settings.APP_ENV.lower() in ("production", "prod") and parsed.scheme != "https":
                raise HTTPException(422, "Production redirect URLs must use HTTPS.")
            platform = {"META_REDIRECT_URI": "meta", "GOOGLE_BUSINESS_REDIRECT_URI": "google_business", "LINKEDIN_REDIRECT_URI": "linkedin"}.get(key)
            if platform:
                path = parsed.path.replace("-", "_")
                allowed = {f"{prefix}/oauth/callback/{platform}" for prefix in ("", "/api/v1")} | {f"{prefix}/oauth/{platform}/callback" for prefix in ("", "/api/v1")}
                if path not in allowed or parsed.query or parsed.fragment:
                    raise HTTPException(422, f"{key} must point to this platform's callback route without a query or fragment.")
                if settings.APP_ENV.lower() in ("production", "prod") and parsed.hostname in ("localhost", "127.0.0.1", "::1"):
                    raise HTTPException(422, "Production callbacks must use a public backend hostname.")
        if key == "SUPER_ADMIN_PIN" and not re.fullmatch(r"\d{6}", str(value)):
            raise HTTPException(422, "Admin PIN must contain six digits.")
        if key in ("EMAIL_FROM", "SUPER_ADMIN_EMAIL") and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", str(value)):
            raise HTTPException(422, f"Invalid email address for {key}.")
        if key in ("TEXT_MODEL_ALIAS", "IMAGE_MODEL") and not re.fullmatch(r"[A-Za-z0-9_.:/-]+", str(value)):
            raise HTTPException(422, "Enter a valid model name without spaces.")
        updates[key] = value
    provider_field = {"text": "TEXT_MODEL_PROVIDER", "image": "IMAGE_MODEL_PROVIDER", "email": "EMAIL_PROVIDER"}.get(section)
    if provider_field in updates:
        providers = SECTIONS[section].get("providers", ("smtp", "resend", "console"))
        if updates[provider_field] not in providers:
            raise HTTPException(422, "Unsupported provider for this section.")
        if updates[provider_field] == "console" and settings.APP_ENV.lower() in ("production", "prod"):
            raise HTTPException(422, "Console email delivery cannot be activated in production.")
    return updates


def _candidate(section, data, changes, remove_keys):
    updates = _normalize(section, changes)
    if not isinstance(remove_keys, list) or any(k not in SECTIONS[section]["keys"] or k not in SECRET_KEYS for k in remove_keys):
        raise HTTPException(422, "Only secret fields from this section can be removed.")
    if set(updates) & set(remove_keys):
        raise HTTPException(422, "A key cannot be replaced and removed in the same save.")
    candidate = {k: _effective(data, k) for k in SECTIONS[section]["keys"]}
    updates.update({k: "" for k in remove_keys})
    candidate.update(updates)
    if section in ("text", "image"):
        provider = candidate[f"{section.upper()}_MODEL_PROVIDER"]
        if provider not in SECTIONS[section]["providers"]:
            raise HTTPException(422, "Unsupported active provider.")
        if provider != "ollama" and not candidate[f"{section.upper()}_{PROVIDER_KEYS[provider]}"]:
            raise HTTPException(422, "The active provider needs an API key. Switch provider before removing its key.")
        model_key = "TEXT_MODEL_ALIAS" if section == "text" else "IMAGE_MODEL"
        if not candidate[model_key]:
            raise HTTPException(422, "The active provider needs a model name.")
    if section in ("tavily", "firecrawl", "seo") and candidate[f"{section.upper()}_ENABLED"]:
        required_keys = {"tavily": ("TAVILY_API_KEY",), "firecrawl": ("FIRECRAWL_API_KEY",), "seo": ("DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD")}[section]
        if any(not candidate[k] for k in required_keys):
            raise HTTPException(422, "Provide required credentials before enabling this research provider.")
    if section == "email":
        required = {"smtp": ("SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"), "resend": ("RESEND_API_KEY",)}
        if any(not candidate[k] for k in required.get(candidate["EMAIL_PROVIDER"], ())):
            raise HTTPException(422, "The active email provider is missing required credentials.")
    if section == "security" and any(not candidate[k] for k in ("SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD", "SUPER_ADMIN_PIN")):
        raise HTTPException(422, "Active admin login credentials cannot be removed.")
    return updates, candidate


def _fingerprint(section, candidate):
    return hashlib.sha256(json.dumps([section, candidate], sort_keys=True).encode()).hexdigest()


def issue_verification(section, candidate):
    return _cipher().encrypt(_fingerprint(section, candidate).encode()).decode()


def prepare_test(section, changes, remove_keys=None):
    data = _load()
    _, candidate = _candidate(section, data, changes, remove_keys or [])
    return candidate


def save_section(section, changes, revision, verification_token=None, remove_keys=None):
    if section not in SECTIONS:
        raise HTTPException(404, "Unknown settings section.")
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with FileLock(str(STORE_PATH) + ".lock", timeout=10):
        data = _load()
        if revision != _revision(section, data):
            raise HTTPException(409, "This section changed elsewhere. Refresh before saving.")
        updates, candidate = _candidate(section, data, changes, remove_keys or [])
        if section in ("text", "image"):
            old = {k: _effective(data, k) for k in SECTIONS[section]["keys"]}
            provider = candidate[f"{section.upper()}_MODEL_PROVIDER"]
            active_fields = [f"{section.upper()}_MODEL_PROVIDER", "TEXT_MODEL_ALIAS" if section == "text" else "IMAGE_MODEL"]
            if provider in PROVIDER_KEYS:
                active_fields.append(f"{section.upper()}_{PROVIDER_KEYS[provider]}")
            if any(candidate[k] != old[k] for k in active_fields):
                try:
                    proof = _cipher().decrypt(str(verification_token or "").encode(), ttl=600).decode()
                    if proof != _fingerprint(section, candidate):
                        raise InvalidToken()
                except (InvalidToken, ValueError):
                    raise HTTPException(422, "Test the selected provider, model and key before activation.") from None
        data.update(updates)
        audit = data.get("__audit", [])
        audit.append({"section": section, "updated_keys": list(updates),
                      "saved_at": datetime.now(timezone.utc).isoformat()})
        data["__audit"] = audit[-100:]
        _write(data)
    return {"status": "ok", "message": "Saved this section. New requests and worker tasks use these settings.",
            "updated_keys": list(updates), "apply_mode": "next_request_or_worker_task"}


def snapshot():
    allowed = {k for spec in SECTIONS.values() for k in spec["keys"]}
    result = {}
    data = _load()
    for key, value in data.items():
        if key not in allowed:
            continue
        field = type(settings).model_fields.get(key)
        secret_type = (field is None and key in SECRET_KEYS) or (field is not None and
                       (field.annotation is SecretStr or SecretStr in get_args(field.annotation)))
        result[key] = SecretStr(str(value)) if secret_type else value
    for key in ("TAVILY_ENABLED", "FIRECRAWL_ENABLED", "SEO_ENABLED"):
        result[key] = _effective(data, key)
    return result


@contextmanager
def settings_scope():
    token = runtime_settings.set(snapshot())
    try:
        yield
    finally:
        runtime_settings.reset(token)


def provider_api_key(kind, provider):
    key = PROVIDER_KEYS[provider]
    current = runtime_settings.get() or {}
    scoped = f"{kind.upper()}_{key}"
    value = current[scoped] if scoped in current else getattr(settings, key, None)
    return raw(value) or ""
