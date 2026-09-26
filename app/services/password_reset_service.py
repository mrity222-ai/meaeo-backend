from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import PasswordResetRequest, User
from app.security.password import PasswordService
from app.services.email_service import EmailService


OTP_EXPIRY_MINUTES = 10
RESET_TOKEN_EXPIRY_MINUTES = 10
RESEND_COOLDOWN_SECONDS = 60
MAX_ATTEMPTS = 5


class PasswordResetService:

    @staticmethod
    def _normalize_email(email: str) -> str:
        return email.strip().lower()

    @staticmethod
    def _hash_value(value: str) -> str:
        return hashlib.sha256(
            value.encode("utf-8")
        ).hexdigest()

    @staticmethod
    def _generate_code() -> str:
        return f"{secrets.randbelow(1_000_000):06d}"

    @staticmethod
    def _generate_reset_token() -> str:
        return secrets.token_urlsafe(48)

    @staticmethod
    def request_reset(
        db: Session,
        *,
        email: str,
    ) -> None:
        """
        Start password recovery.

        Important:
        We intentionally do not reveal whether the email
        belongs to an existing account.
        """

        email = PasswordResetService._normalize_email(email)

        now = datetime.now(timezone.utc)

        existing_request = db.scalar(
            select(PasswordResetRequest)
            .where(
                PasswordResetRequest.email == email
            )
            .order_by(
                PasswordResetRequest.id.desc()
            )
        )

        if existing_request is not None:
            last_sent = existing_request.last_sent_at

            if last_sent.tzinfo is None:
                last_sent = last_sent.replace(
                    tzinfo=timezone.utc
                )

            elapsed = (
                now - last_sent
            ).total_seconds()

            if elapsed < RESEND_COOLDOWN_SECONDS:
                remaining = int(
                    RESEND_COOLDOWN_SECONDS - elapsed
                )

                raise ValueError(
                    f"Please wait {remaining} seconds "
                    "before requesting another code."
                )

            db.delete(existing_request)
            db.flush()

        code = PasswordResetService._generate_code()

        reset_request = PasswordResetRequest(
            email=email,
            code_hash=PasswordResetService._hash_value(
                code
            ),
            reset_token_hash=None,
            expires_at=(
                now
                + timedelta(
                    minutes=OTP_EXPIRY_MINUTES
                )
            ),
            last_sent_at=now,
            attempts=0,
            max_attempts=MAX_ATTEMPTS,
        )

        db.add(reset_request)
        db.commit()

        try:
            # Only send the code if an account exists.
            # The API response itself remains generic.
            user = db.scalar(
                select(User)
                .where(User.email == email)
            )

            if user is not None:
                EmailService.send_verification_code(
                    email=email,
                    code=code,
                )
        except Exception:
            db.delete(reset_request)
            db.commit()
            raise

    @staticmethod
    def verify_code(
        db: Session,
        *,
        email: str,
        code: str,
    ) -> str:
        """
        Verify the password-reset OTP.

        Returns a short-lived reset token.
        """

        email = PasswordResetService._normalize_email(
            email
        )

        reset_request = db.scalar(
            select(PasswordResetRequest)
            .where(
                PasswordResetRequest.email == email,
                PasswordResetRequest.verified_at.is_(None),
            )
            .order_by(
                PasswordResetRequest.id.desc()
            )
        )

        if reset_request is None:
            raise ValueError(
                "No active password reset request was found."
            )

        now = datetime.now(timezone.utc)

        expires_at = reset_request.expires_at

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(
                tzinfo=timezone.utc
            )

        if now >= expires_at:
            db.delete(reset_request)
            db.commit()

            raise ValueError(
                "The verification code has expired. "
                "Please request a new code."
            )

        if (
            reset_request.attempts
            >= reset_request.max_attempts
        ):
            raise ValueError(
                "Too many incorrect attempts. "
                "Please request a new code."
            )

        if len(code) != 6 or not code.isdigit():
            reset_request.attempts += 1
            db.commit()

            raise ValueError(
                "Invalid verification code."
            )

        expected_hash = reset_request.code_hash

        actual_hash = (
            PasswordResetService._hash_value(code)
        )

        if not secrets.compare_digest(
            expected_hash,
            actual_hash,
        ):
            reset_request.attempts += 1
            db.commit()

            raise ValueError(
                "Invalid verification code."
            )

        user = db.scalar(
            select(User)
            .where(User.email == email)
        )

        if user is None:
            # Do not expose whether the account exists.
            db.delete(reset_request)
            db.commit()

            raise ValueError(
                "Unable to verify this password reset request."
            )

        reset_token = (
            PasswordResetService._generate_reset_token()
        )

        reset_request.reset_token_hash = (
            PasswordResetService._hash_value(
                reset_token
            )
        )

        reset_request.verified_at = now

        # Reuse expires_at as the reset-token expiration.
        reset_request.expires_at = (
            now
            + timedelta(
                minutes=RESET_TOKEN_EXPIRY_MINUTES
            )
        )

        db.commit()

        return reset_token

    @staticmethod
    def reset_password(
        db: Session,
        *,
        email: str,
        reset_token: str,
        new_password: str,
    ) -> None:
        """
        Set a new password using a verified reset token.
        """

        email = PasswordResetService._normalize_email(
            email
        )

        if len(new_password) < 8:
            raise ValueError(
                "Password must be at least 8 characters."
            )

        reset_request = db.scalar(
            select(PasswordResetRequest)
            .where(
                PasswordResetRequest.email == email,
                PasswordResetRequest.verified_at.is_not(None),
            )
            .order_by(
                PasswordResetRequest.id.desc()
            )
        )

        if reset_request is None:
            raise ValueError(
                "No active password reset request was found."
            )

        if not reset_request.reset_token_hash:
            raise ValueError(
                "This password reset request is invalid."
            )

        now = datetime.now(timezone.utc)

        expires_at = reset_request.expires_at

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(
                tzinfo=timezone.utc
            )

        if now >= expires_at:
            db.delete(reset_request)
            db.commit()

            raise ValueError(
                "The password reset session has expired. "
                "Please request a new code."
            )

        actual_hash = (
            PasswordResetService._hash_value(
                reset_token
            )
        )

        if not secrets.compare_digest(
            reset_request.reset_token_hash,
            actual_hash,
        ):
            raise ValueError(
                "Invalid password reset token."
            )

        user = db.scalar(
            select(User)
            .where(User.email == email)
        )

        if user is None:
            raise ValueError(
                "Unable to reset this password."
            )

        user.password_hash = PasswordService.hash(
            new_password
        )

        db.delete(reset_request)
        db.commit()