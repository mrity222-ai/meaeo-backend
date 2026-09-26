from __future__ import annotations

import hashlib
import hmac
import time

from app.models.config import settings


class AssetURLSigner:

    @staticmethod
    def _secret() -> bytes:
        return settings.ASSET_SIGNING_SECRET.get_secret_value().encode(
            "utf-8"
        )

    @classmethod
    def sign(
        cls,
        tenant_id: str,
        asset_id: str,
        expires: int,
    ) -> str:

        payload = (
            f"{tenant_id}:{asset_id}:{expires}"
        ).encode("utf-8")

        return hmac.new(
            cls._secret(),
            payload,
            hashlib.sha256,
        ).hexdigest()

    @classmethod
    def verify(
        cls,
        tenant_id: str,
        asset_id: str,
        expires: int,
        signature: str,
    ) -> bool:

        if expires < int(time.time()):
            return False

        expected = cls.sign(
            tenant_id=tenant_id,
            asset_id=asset_id,
            expires=expires,
        )

        return hmac.compare_digest(
            expected,
            signature,
        )

