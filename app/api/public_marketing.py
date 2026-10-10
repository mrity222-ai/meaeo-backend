"""Public website enquiries and opt-in records; no simulated delivery success."""
import hashlib
import re
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.database.models import StorageDocument
from app.database.session import get_db

router = APIRouter(prefix="/public", tags=["public marketing"])


class NewsletterRequest(BaseModel):
    email: str = Field(max_length=254)
    consent: bool
    website: str = Field(default="", max_length=200)  # Honeypot

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address.")
        return value


class ContactRequest(NewsletterRequest):
    name: str = Field(min_length=1, max_length=120)
    subject: str = Field(min_length=1, max_length=160)
    message: str = Field(min_length=10, max_length=5000)

    @field_validator("name", "subject", "message", mode="before")
    @classmethod
    def trim_text(cls, value):
        return value.strip() if isinstance(value, str) else value


def check_submission(body: NewsletterRequest, request: Request, db: Session) -> None:
    if body.website or not body.consent:
        raise HTTPException(422, "Consent is required and the submission must be valid.")
    # Database-backed throttle shared across API processes. Never trust forwarded IP headers.
    address = request.client.host if request.client else "unknown"
    digest = hashlib.sha256(address.encode()).hexdigest()
    key = f"marketing/rate/{digest}"
    now = datetime.now(timezone.utc)
    record = db.get(StorageDocument, key)
    data = record.data if record else {}
    start = datetime.fromisoformat(data["start"]) if data.get("start") else now
    count = int(data.get("count", 0)) if now - start < timedelta(minutes=10) else 0
    if count >= 10:
        raise HTTPException(429, "Too many requests. Please try again later.")
    new_data = {"start": (start if count else now).isoformat(), "count": count + 1}
    if record:
        record.data = new_data
    else:
        db.add(StorageDocument(storage_key=key, data=new_data))


@router.post("/contact", status_code=201)
def contact(body: ContactRequest, request: Request, db: Session = Depends(get_db)):
    check_submission(body, request, db)
    reference = f"WEB-{uuid.uuid4().hex[:12].upper()}"
    db.add(StorageDocument(storage_key=f"marketing/contact/{reference}", data={
        **body.model_dump(exclude={"website"}), "reference": reference,
        "status": "received", "created_at": datetime.now(timezone.utc).isoformat(),
    }))
    db.commit()
    return {"success": True, "reference": reference, "status": "received"}


@router.post("/newsletter")
def newsletter(body: NewsletterRequest, request: Request, db: Session = Depends(get_db)):
    check_submission(body, request, db)
    digest = hashlib.sha256(body.email.encode()).hexdigest()
    key = f"marketing/newsletter/{digest}"
    if not db.get(StorageDocument, key):
        db.add(StorageDocument(storage_key=key, data={"email": body.email,
            "consent": True, "created_at": datetime.now(timezone.utc).isoformat()}))
    db.commit()
    return {"success": True, "status": "registered"}


@router.get("/submissions", dependencies=[Depends(get_current_admin)])
def submissions(db: Session = Depends(get_db)):
    records = db.scalars(select(StorageDocument).where(
        StorageDocument.storage_key.like("marketing/contact/%")
    ).order_by(StorageDocument.data["created_at"].as_string().desc()).limit(200)).all()
    return [record.data for record in records]
