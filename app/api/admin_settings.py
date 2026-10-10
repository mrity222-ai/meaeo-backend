"""Purpose-based API configuration; no real secret is returned to the browser."""
import asyncio
from typing import Any
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.dependencies import get_current_admin
from app.services import admin_settings_service as service

router = APIRouter(prefix="/admin/settings/sections", tags=["Admin Settings"],
                   dependencies=[Depends(get_current_admin)])


class SectionUpdate(BaseModel):
    changes: dict[str, Any] = Field(default_factory=dict)
    revision: str = ""
    verification_token: str | None = None
    remove_keys: list[str] = Field(default_factory=list)


@router.get("")
def get_sections():
    return service.describe_sections()


@router.post("/{section}")
def save_section(section: str, payload: SectionUpdate):
    return service.save_section(section, payload.changes, payload.revision,
                                payload.verification_token, payload.remove_keys)


async def check_connection(section: str, candidate: dict) -> str:
    """Checks the selected provider only. Never falls back to a different model/provider."""
    if section in ("text", "image"):
        provider = candidate[f"{section.upper()}_MODEL_PROVIDER"]
        model = candidate["TEXT_MODEL_ALIAS" if section == "text" else "IMAGE_MODEL"]
        if section == "text":
            from app.models.registry import ModelRegistry
            model = ModelRegistry.get_model(provider, model)
        if provider == "ollama":
            import ollama
            await asyncio.to_thread(ollama.show, model)
            return "Selected local model is available."
        api_key = candidate[f"{section.upper()}_{service.PROVIDER_KEYS[provider]}"]
        if provider == "openai":
            from openai import AsyncOpenAI
            async with AsyncOpenAI(api_key=api_key, timeout=20, max_retries=0) as client:
                await client.models.retrieve(model)
            return "Credentials and selected model access verified; generation was not run."
        async with httpx.AsyncClient(timeout=20) as client:
            if provider == "huggingface":
                headers = {"Authorization": f"Bearer {api_key}"}
                response = await client.get("https://huggingface.co/api/whoami-v2", headers=headers)
                response.raise_for_status()
                response = await client.get(f"https://huggingface.co/api/models/{quote(model, safe='/')}", headers=headers)
                response.raise_for_status()
                return "Token and model visibility verified. Inference availability/quota needs a generation check."
            if provider == "gemini":
                headers = {"x-goog-api-key": api_key}
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{quote(model, safe='')}"
                if section == "text":
                    response = await client.post(url + ":generateContent", headers=headers,
                        json={"contents": [{"parts": [{"text": "ping"}]}], "generationConfig": {"maxOutputTokens": 3}})
                else:
                    response = await client.get(url, headers=headers)
                response.raise_for_status()
                return "Selected Gemini model verified; image generation was not run." if section == "image" else "Selected text model responded."
            if provider == "anthropic":
                response = await client.post("https://api.anthropic.com/v1/messages",
                    headers={"x-api-key": api_key, "anthropic-version": "2023-06-01"},
                    json={"model": model, "messages": [{"role": "user", "content": "ping"}], "max_tokens": 3})
                response.raise_for_status()
                return "Selected text model responded."
            if provider == "stability":
                if model != "core":
                    raise HTTPException(422, "This integration uses Stability Core; select model 'core'.")
                response = await client.get("https://api.stability.ai/v1/user/account", headers={"Authorization": f"Bearer {api_key}"})
                response.raise_for_status()
                return "Stability credentials verified; image generation was not run."
    async with httpx.AsyncClient(timeout=20) as client:
        if section == "tavily":
            response = await client.post("https://api.tavily.com/search", json={"api_key": candidate["TAVILY_API_KEY"], "query": "marketing", "max_results": 1})
        elif section == "firecrawl":
            response = await client.post("https://api.firecrawl.dev/v2/scrape", headers={"Authorization": f"Bearer {candidate['FIRECRAWL_API_KEY']}"},
                                         json={"url": "https://example.com", "formats": ["markdown"]})
        elif section == "seo":
            response = await client.get("https://api.dataforseo.com/v3/appendix/user_data", auth=(candidate["DATAFORSEO_LOGIN"], candidate["DATAFORSEO_PASSWORD"]))
            response.raise_for_status()
            result = response.json()
            if result.get("status_code") != 20000 or any(t.get("status_code") != 20000 for t in result.get("tasks", [])):
                raise HTTPException(422, "DataForSEO did not validate the supplied credentials.")
        elif section == "payments":
            response = await client.get("https://api.razorpay.com/v1/payments", params={"count": 1}, auth=(candidate["RAZORPAY_KEY_ID"], candidate["RAZORPAY_KEY_SECRET"]))
        elif section == "email":
            if candidate["EMAIL_PROVIDER"] == "resend":
                # Restricted send-only keys may not allow domain reads; report that failure clearly.
                response = await client.get("https://api.resend.com/domains", headers={"Authorization": f"Bearer {candidate['RESEND_API_KEY']}"})
            elif candidate["EMAIL_PROVIDER"] == "smtp":
                import smtplib
                def verify_smtp():
                    cls = smtplib.SMTP_SSL if candidate["SMTP_PORT"] == 465 else smtplib.SMTP
                    with cls(candidate["SMTP_HOST"], candidate["SMTP_PORT"], timeout=15) as smtp:
                        smtp.ehlo()
                        if candidate["SMTP_USE_TLS"] and candidate["SMTP_PORT"] != 465:
                            smtp.starttls()
                            smtp.ehlo()
                        smtp.login(candidate["SMTP_USER"], candidate["SMTP_PASSWORD"])
                await asyncio.to_thread(verify_smtp)
                return "SMTP login verified. No email was sent."
            else:
                return "Console mode selected; no external email delivery."
        else:
            raise HTTPException(422, "Verify this integration by reconnecting a test account; credentials alone cannot verify account permissions.")
        response.raise_for_status()
        if section in ("tavily", "firecrawl") and response.json().get("success") is False:
            raise HTTPException(422, "Provider reported an unsuccessful connection test.")
    return "Connection verified. Account-specific permissions and full live flow still need testing."


@router.post("/{section}/test")
async def test_section(section: str, payload: SectionUpdate):
    candidate = service.prepare_test(section, payload.changes, payload.remove_keys)
    try:
        message = await check_connection(section, candidate)
    except HTTPException:
        raise
    except Exception:
        # Provider errors can contain request URLs/keys; never return the raw exception.
        return {"success": False, "message": "Connection test failed. Check credentials, selected model, permissions, quota and network. Active settings were not changed."}
    return {"success": True, "message": message,
            "verification_token": service.issue_verification(section, candidate)}
