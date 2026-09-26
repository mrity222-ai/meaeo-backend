from __future__ import annotations

import secrets
from dataclasses import dataclass

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import Tenant, User, UserTenant
from app.models.config import settings
from app.security.authentication import AuthenticationService
from app.security.password import PasswordService


GOOGLE_ISSUERS = {
    "accounts.google.com",
    "https://accounts.google.com",
}


@dataclass(frozen=True)
class GoogleIdentity:
    subject: str
    email: str
    name: str | None
    email_verified: bool


class GoogleAuthenticationService:
    """Authenticate application users using Google ID tokens."""

    @staticmethod
    def verify_id_token(credential: str) -> GoogleIdentity:
        if not credential or not credential.strip():
            raise ValueError("Google credential is required.")

        if not settings.GOOGLE_CLIENT_ID:
            raise ValueError("GOOGLE_CLIENT_ID is not configured.")

        try:
            payload = google_id_token.verify_oauth2_token(
                credential.strip(),
                google_requests.Request(),
                audience=settings.GOOGLE_CLIENT_ID,
            )
        except Exception as exc:
            raise ValueError(
                "Invalid Google authentication credential."
            ) from exc

        issuer = payload.get("iss")
        if issuer not in GOOGLE_ISSUERS:
            raise ValueError("Invalid Google token issuer.")

        subject = str(payload.get("sub") or "").strip()
        email = str(payload.get("email") or "").strip().lower()
        name = payload.get("name")

        email_verified = bool(payload.get("email_verified"))

        if not subject:
            raise ValueError("Google token does not contain a subject.")

        if not email:
            raise ValueError("Google token does not contain an email address.")

        if not email_verified:
            raise ValueError("Google email address is not verified.")

        return GoogleIdentity(
            subject=subject,
            email=email,
            name=str(name).strip() if name else None,
            email_verified=email_verified,
        )

    @staticmethod
    def authenticate(
        db: Session,
        credential: str,
    ) -> str:
        identity = GoogleAuthenticationService.verify_id_token(
            credential
        )

        # ---------------------------------------------------------
        # 1. Existing Google identity
        # ---------------------------------------------------------

        user = db.scalar(
            select(User).where(
                User.google_subject == identity.subject
            )
        )

        # ---------------------------------------------------------
        # 2. Existing local account with verified same email
        # ---------------------------------------------------------

        if user is None:
            user = db.scalar(
                select(User).where(
                    User.email == identity.email
                )
            )

            if user is not None:
                if not user.is_active:
                    raise ValueError("User account is inactive.")

                if user.google_subject not in {
                    None,
                    identity.subject,
                }:
                    raise ValueError(
                        "Google identity is already linked to another account."
                    )

                user.google_subject = identity.subject

        # ---------------------------------------------------------
        # 3. New Google user
        # ---------------------------------------------------------

        if user is None:
            unusable_password = secrets.token_urlsafe(48)

            user = User(
                email=identity.email,
                password_hash=PasswordService.hash(
                    unusable_password
                ),
                google_subject=identity.subject,
                is_active=True,
            )

            db.add(user)
            db.flush()

            tenant_name = (
                identity.name
                or identity.email.split("@", 1)[0]
                or "My Business"
            )

            tenant = Tenant(
                tenant_id=f"tenant_google_{secrets.token_hex(16)}",
                name=tenant_name[:255],
            )

            db.add(tenant)
            db.flush()

            membership = UserTenant(
                user_id=user.id,
                tenant_id=tenant.id,
                is_active=True,
            )

            db.add(membership)

        # ---------------------------------------------------------
        # 4. Make sure an active workspace exists
        # ---------------------------------------------------------

        active_membership = db.scalar(
            select(UserTenant).where(
                UserTenant.user_id == user.id,
                UserTenant.is_active.is_(True),
            ).order_by(UserTenant.id.asc())
        )

        if active_membership is None:
            tenant = Tenant(
                tenant_id=f"tenant_google_{secrets.token_hex(16)}",
                name=(
                    identity.name
                    or identity.email.split("@", 1)[0]
                    or "My Business"
                )[:255],
            )

            db.add(tenant)
            db.flush()

            membership = UserTenant(
                user_id=user.id,
                tenant_id=tenant.id,
                is_active=True,
            )

            db.add(membership)

        db.commit()
        db.refresh(user)

        return AuthenticationService.create_access_token(user)