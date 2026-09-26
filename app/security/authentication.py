from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import jwt

from app.database.models import User
from app.models.config import settings


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: int
    email: str
    is_active: bool

    @classmethod
    def from_user(
        cls,
        user: User,
    ) -> "AuthenticatedUser":
        return cls(
            user_id=user.id,
            email=user.email,
            is_active=user.is_active,
        )


class AuthenticationService:
    @staticmethod
    def create_access_token(
        user: User,
    ) -> str:
        now = datetime.now(timezone.utc)

        expires = now + timedelta(
            minutes=settings.JWT_EXPIRE_MINUTES
        )

        payload = {
            "sub": str(user.id),
            "email": user.email,
            "iat": now,
            "exp": expires,
        }

        return jwt.encode(
            payload,
            settings.JWT_SECRET_KEY.get_secret_value(),
            algorithm=settings.JWT_ALGORITHM,
        )

    @staticmethod
    def decode_access_token(
        token: str,
    ) -> int:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY.get_secret_value(),
            algorithms=[settings.JWT_ALGORITHM],
        )

        subject = payload.get("sub")

        if not subject:
            raise ValueError(
                "Token subject is missing."
            )

        try:
            user_id = int(subject)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "Invalid token subject."
            ) from exc

        if user_id <= 0:
            raise ValueError(
                "Invalid token subject."
            )

        return user_id