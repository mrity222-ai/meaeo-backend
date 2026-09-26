from __future__ import annotations

import time
from urllib.parse import urlencode

from app.assets.signing import AssetURLSigner
from app.models.config import settings


class AssetDeliveryService:

    def create_url(
        self,
        tenant_id: str,
        asset_id: str,
        ttl_seconds: int | None = None,
    ) -> str:

        ttl = (
            ttl_seconds
            if ttl_seconds is not None
            else settings.ASSET_URL_TTL_SECONDS
        )

        expires = int(time.time()) + ttl

        signature = AssetURLSigner.sign(
            tenant_id=tenant_id,
            asset_id=asset_id,
            expires=expires,
        )

        base = (
            settings.ASSET_PUBLIC_BASE_URL
            .rstrip("/")
        )

        query = urlencode(
            {
                "expires": expires,
                "signature": signature,
            }
        )

        return (
            f"{base}/assets/"
            f"{tenant_id}/"
            f"{asset_id}"
            f"?{query}"
        )

    def verify_url(
        self,
        tenant_id: str,
        asset_id: str,
        expires: int,
        signature: str,
    ) -> bool:

        return AssetURLSigner.verify(
            tenant_id=tenant_id,
            asset_id=asset_id,
            expires=expires,
            signature=signature,
        )