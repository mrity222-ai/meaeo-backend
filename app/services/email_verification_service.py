from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.database.models import (
    BusinessAccount,
    EmailVerification,
    Tenant,
    User,
    UserTenant,
)
from app.security.authentication import AuthenticationService
from app.security.password import PasswordService
from app.services.email_service import EmailService


OTP_EXPIRY_MINUTES = 10
RESEND_COOLDOWN_SECONDS = 60
MAX_ATTEMPTS = 5


class EmailVerificationService:

    @staticmethod
    def _normalize_email(email: str) -> str:
        return email.strip().lower()

    @staticmethod
    def _hash_code(code: str) -> str:
        return hashlib.sha256(code.encode("utf-8")).hexdigest()

    @staticmethod
    def _generate_code() -> str:
        return f"{secrets.randbelow(1_000_000):06d}"

    @staticmethod
    def request_verification(
        db: Session,
        *,
        email: str,
        password: str,
        name: str,
        business_name: str,
    ) -> None:
        email = EmailVerificationService._normalize_email(email)

        name = name.strip()
        if not name:
            raise ValueError("Name is required.")

        business_name = (business_name or f"{name}'s Business").strip()

        existing_user = db.scalar(
            select(User).where(User.email == email)
        )

        if existing_user is not None:
            raise ValueError(
                "An account with this email already exists. Please sign in."
            )

        existing = db.scalar(
            select(EmailVerification)
            .where(EmailVerification.email == email)
            .order_by(EmailVerification.id.desc())
        )

        now = datetime.now(timezone.utc)

        if existing is not None:
            last_sent = existing.last_sent_at

            if last_sent.tzinfo is None:
                last_sent = last_sent.replace(tzinfo=timezone.utc)

            elapsed = (now - last_sent).total_seconds()

            if elapsed < RESEND_COOLDOWN_SECONDS:
                remaining = int(
                    RESEND_COOLDOWN_SECONDS - elapsed
                )

                raise ValueError(
                    f"Please wait {remaining} seconds before requesting another code."
                )

            db.delete(existing)
            db.flush()

        code = EmailVerificationService._generate_code()

        verification = EmailVerification(
            email=email,
            code_hash=EmailVerificationService._hash_code(code),
            name=name,
            business_name=business_name,
            password_hash=PasswordService.hash(password),
            expires_at=now + timedelta(minutes=OTP_EXPIRY_MINUTES),
            last_sent_at=now,
            attempts=0,
            max_attempts=MAX_ATTEMPTS,
        )

        db.add(verification)
        db.commit()

        try:
            EmailService.send_verification_code(
                email=email,
                code=code,
            )
        except Exception:
            db.delete(verification)
            db.commit()
            raise

    @staticmethod
    def verify(
        db: Session,
        *,
        email: str,
        code: str,
    ) -> str:
        email = EmailVerificationService._normalize_email(email)

        verification = db.scalar(
            select(EmailVerification)
            .where(
                EmailVerification.email == email,
                EmailVerification.verified_at.is_(None),
            )
            .order_by(EmailVerification.id.desc())
        )

        if verification is None:
            raise ValueError(
                "No active email verification request was found."
            )

        now = datetime.now(timezone.utc)

        expires_at = verification.expires_at

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if now >= expires_at:
            db.delete(verification)
            db.commit()

            raise ValueError(
                "The verification code has expired. Please request a new code."
            )

        if verification.attempts >= verification.max_attempts:
            raise ValueError(
                "Too many incorrect attempts. Please request a new code."
            )

        if len(code) != 6 or not code.isdigit():
            verification.attempts += 1
            db.commit()

            raise ValueError("Invalid verification code.")

        expected_hash = verification.code_hash
        actual_hash = EmailVerificationService._hash_code(code)

        if not secrets.compare_digest(
            expected_hash,
            actual_hash,
        ):
            verification.attempts += 1
            db.commit()

            raise ValueError("Invalid verification code.")

        existing_user = db.scalar(
            select(User).where(User.email == email)
        )

        if existing_user is not None:
            db.delete(verification)
            db.commit()

            raise ValueError(
                "An account with this email already exists. Please sign in."
            )

        user = User(
            email=email,
            password_hash=verification.password_hash,
            is_active=True,
        )

        db.add(user)
        db.flush()

        tenant = Tenant(
            tenant_id=f"tenant_{secrets.token_hex(16)}",
            name=verification.business_name[:255] if verification.business_name else f"{email.split('@')[0]}'s Business",
        )
        db.add(tenant)
        db.flush()

        # Check if membership already exists or handle cleanly
        existing_ut = db.scalar(
            select(UserTenant).where(
                UserTenant.user_id == user.id,
                UserTenant.tenant_id == tenant.id,
            )
        )
        if existing_ut:
            existing_ut.is_active = True
        else:
            membership = UserTenant(
                user_id=user.id,
                tenant_id=tenant.id,
                is_active=True,
            )
            db.add(membership)
            db.flush()

        biz = BusinessAccount(
            tenant_id=tenant.tenant_id,
            name=verification.business_name[:255] if verification.business_name else f"{email.split('@')[0]}'s Business",
            status="active",
        )
        db.add(biz)
        db.flush()

        verification.verified_at = now

        db.delete(verification)

        db.commit()
        db.refresh(user)
        db.refresh(biz)

        token = AuthenticationService.create_access_token(user)
        return token, tenant.tenant_id, biz.id