from __future__ import annotations

import hashlib
import hmac
import mimetypes
import secrets
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.assets.storage import (
    AssetStorage,
    AssetStorageFactory,
)
from app.database.models import (
    Asset,
    AssetUsage,
    BusinessAccount,
)
from app.models.config import settings


class AssetService:

    ALLOWED_MIME_TYPES = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    def __init__(
        self,
        db: Session,
        storage: AssetStorage | None = None,
    ):
        self.db = db

        self.storage = (
            storage
            if storage is not None
            else AssetStorageFactory.create()
        )

    # -------------------------------------------------
    # Validation
    # -------------------------------------------------

    @staticmethod
    def _validate_tenant(
        tenant_id: str,
    ) -> str:

        tenant_id = tenant_id.strip().lower()

        if not tenant_id:
            raise ValueError(
                "tenant_id cannot be empty."
            )

        if "/" in tenant_id or "\\" in tenant_id:
            raise ValueError(
                "Invalid tenant_id."
            )

        return tenant_id

    def _validate_business_account(
        self,
        tenant_id: str,
        business_account_id: int,
    ) -> BusinessAccount:

        tenant_id = self._validate_tenant(
            tenant_id
        )

        if business_account_id <= 0:
            raise ValueError(
                "business_account_id must be greater than 0."
            )

        business_account = self.db.scalar(
            select(BusinessAccount).where(
                BusinessAccount.id
                == business_account_id,
                BusinessAccount.tenant_id
                == tenant_id,
            )
        )

        if business_account is None:
            raise ValueError(
                "Business Account was not found "
                "for the specified tenant."
            )

        if business_account.status != "active":
            raise ValueError(
                "Business Account is not active."
            )

        return business_account

    def validate_business_account_access(
        self,
        *,
        tenant_id: str,
        business_account_id: int,
    ) -> BusinessAccount:
        return self._validate_business_account(
            tenant_id=tenant_id,
            business_account_id=business_account_id,
        )

    # -------------------------------------------------
    # File helpers
    # -------------------------------------------------

    @staticmethod
    def _extension(
        source_path: Path,
        mime_type: str,
    ) -> str:

        extension = source_path.suffix.lower()

        if extension in {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
        }:
            return extension

        guessed = mimetypes.guess_extension(
            mime_type
        )

        return guessed or ".bin"

    @staticmethod
    def _hash_file(
        path: Path,
    ) -> str:

        digest = hashlib.sha256()

        with open(
            path,
            "rb",
        ) as file:

            while True:

                chunk = file.read(
                    1024 * 1024
                )

                if not chunk:
                    break

                digest.update(chunk)

        return digest.hexdigest()

    # -------------------------------------------------
    # Asset registration
    # -------------------------------------------------

    def register_file(
        self,
        *,
        tenant_id: str,
        business_account_id: int,
        source_path: str | Path,
        source: str,
    ) -> Asset:

        tenant_id = self._validate_tenant(
            tenant_id
        )

        self._validate_business_account(
            tenant_id=tenant_id,
            business_account_id=business_account_id,
        )

        source_path = Path(
            source_path
        )

        if not source_path.exists():
            raise FileNotFoundError(
                "Asset source does not exist: "
                f"{source_path}"
            )

        if not source_path.is_file():
            raise ValueError(
                "Asset source is not a file."
            )

        mime_type, _ = mimetypes.guess_type(
            source_path.name
        )

        mime_type = (
            mime_type
            or "application/octet-stream"
        )

        if mime_type not in self.ALLOWED_MIME_TYPES:
            raise ValueError(
                "Unsupported image type: "
                f"{mime_type}"
            )

        file_hash = self._hash_file(
            source_path
        )

        # -------------------------------------------------
        # Asset deduplication is scoped to both
        # tenant AND Business Account.
        #
        # The same physical image may therefore exist
        # independently for two businesses.
        # -------------------------------------------------

        existing = self.db.scalar(
            select(Asset).where(
                Asset.tenant_id == tenant_id,
                Asset.business_account_id
                == business_account_id,
                Asset.sha256 == file_hash,
                Asset.status != "deleted",
            )
        )

        if existing is not None:
            return existing

        asset_id = secrets.token_hex(
            24
        )

        extension = self._extension(
            source_path,
            mime_type,
        )

        storage_key = (
            f"{tenant_id}/"
            f"{business_account_id}/"
            f"{asset_id}"
            f"{extension}"
        )

        # -------------------------------------------------
        # Persistent storage is provider-agnostic.
        #
        # LocalAssetStorage currently stores this on the
        # Contabo VPS. A future S3/R2 provider can use the
        # exact same storage_key.
        # -------------------------------------------------

        self.storage.save_file(
            source_path=source_path,
            storage_key=storage_key,
        )

        try:
            asset = Asset(
                id=asset_id,
                tenant_id=tenant_id,
                business_account_id=business_account_id,
                storage_key=storage_key,
                original_filename=source_path.name,
                mime_type=mime_type,
                sha256=file_hash,
                source=source,
                status="available",
                usage_count=0,
            )

            self.db.add(asset)

            self.db.commit()

            self.db.refresh(asset)

            return asset

        except Exception:
            # Prevent an orphaned storage object if the
            # database transaction fails after the file
            # has already been persisted.
            try:
                self.storage.delete(
                    storage_key=storage_key,
                )
            except Exception:
                # Preserve the original database exception.
                pass

            self.db.rollback()

            raise

    # -------------------------------------------------
    # Asset retrieval
    # -------------------------------------------------

    def get_asset(
        self,
        *,
        tenant_id: str,
        business_account_id: int,
        asset_id: str,
    ) -> Asset | None:

        tenant_id = self._validate_tenant(
            tenant_id
        )

        self._validate_business_account(
            tenant_id=tenant_id,
            business_account_id=business_account_id,
        )

        return self.db.scalar(
            select(Asset).where(
                Asset.id == asset_id,
                Asset.tenant_id == tenant_id,
                Asset.business_account_id
                == business_account_id,
                Asset.status != "deleted",
            )
        )

    def get_asset_for_signed_url(
        self,
        *,
        tenant_id: str,
        asset_id: str,
    ) -> Asset | None:

        tenant_id = self._validate_tenant(
            tenant_id
        )

        return self.db.scalar(
            select(Asset).where(
                Asset.id == asset_id,
                Asset.tenant_id == tenant_id,
                Asset.status != "deleted",
            )
        )

    # -------------------------------------------------
    # Asset storage access
    # -------------------------------------------------

    def asset_exists(
        self,
        asset: Asset,
    ) -> bool:

        return self.storage.exists(
            storage_key=asset.storage_key
        )

    def iter_asset_bytes(
        self,
        asset: Asset,
    ):

        return self.storage.iter_bytes(
            storage_key=asset.storage_key
        )

    def delete_asset_file(
        self,
        asset: Asset,
    ) -> None:

        self.storage.delete(
            storage_key=asset.storage_key
        )

    # -------------------------------------------------
    # Signed URLs
    # -------------------------------------------------

    def build_signed_url(
        self,
        asset: Asset,
        ttl_seconds: int | None = None,
    ) -> str:

        from app.assets.signing import (
            AssetURLSigner,
        )

        ttl = (
            ttl_seconds
            if ttl_seconds is not None
            else settings.ASSET_URL_TTL_SECONDS
        )

        if ttl <= 0:
            raise ValueError(
                "ttl_seconds must be greater than zero."
            )

        expires = (
            int(time.time())
            + ttl
        )

        signature = (
            AssetURLSigner.sign(
                tenant_id=asset.tenant_id,
                asset_id=asset.id,
                expires=expires,
            )
        )

        base_url = (
            settings.ASSET_PUBLIC_BASE_URL
            .rstrip("/")
        )

        tenant = quote(
            asset.tenant_id,
            safe="",
        )

        return (
            f"{base_url}/assets/"
            f"{tenant}/{asset.id}"
            f"?expires={expires}"
            f"&signature={signature}"
        )

    @staticmethod
    def verify_signature(
        tenant_id: str,
        asset_id: str,
        expires: int,
        signature: str,
    ) -> bool:

        if expires < int(time.time()):
            return False

        secret = (
            settings.ASSET_SIGNING_SECRET
            .get_secret_value()
        )

        payload = (
            f"{tenant_id}:"
            f"{asset_id}:"
            f"{expires}"
        )

        expected = hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(
            expected,
            signature,
        )

    @staticmethod
    def _signing_secret() -> bytes:

        return (
            settings.ASSET_SIGNING_SECRET
            .get_secret_value()
            .encode("utf-8")
        )

    # -------------------------------------------------
    # Asset usage
    # -------------------------------------------------

    def reserve_usage(
        self,
        *,
        asset: Asset,
        campaign_name: str,
        day: int,
        platform: str,
    ) -> AssetUsage:

        existing = self.db.scalar(
            select(AssetUsage).where(
                AssetUsage.asset_id
                == asset.id,
                AssetUsage.campaign_name
                == campaign_name,
                AssetUsage.day == day,
                AssetUsage.platform
                == platform,
            )
        )

        if existing is not None:
            return existing

        usage = AssetUsage(
            asset_id=asset.id,
            tenant_id=asset.tenant_id,
            campaign_name=campaign_name,
            day=day,
            platform=platform,
            status="reserved",
        )

        asset.usage_count += 1

        asset.last_used_at = (
            datetime.now(timezone.utc)
        )

        self.db.add(usage)

        self.db.commit()

        self.db.refresh(usage)

        return usage

    def mark_usage_published(
        self,
        *,
        asset_id: str,
        campaign_name: str,
        day: int,
        platform: str,
        external_id: str | None = None,
    ) -> None:

        usage = self.db.scalar(
            select(AssetUsage).where(
                AssetUsage.asset_id
                == asset_id,
                AssetUsage.campaign_name
                == campaign_name,
                AssetUsage.day == day,
                AssetUsage.platform
                == platform,
            )
        )

        if usage is None:
            return

        usage.status = "published"

        usage.external_id = external_id

        self.db.commit()

    # -------------------------------------------------
    # Asset selection
    # -------------------------------------------------

    def select_available_asset(
        self,
        *,
        tenant_id: str,
        business_account_id: int,
        source: str | None = None,
    ) -> Asset | None:

        tenant_id = self._validate_tenant(
            tenant_id
        )

        self._validate_business_account(
            tenant_id=tenant_id,
            business_account_id=business_account_id,
        )

        query = (
            select(Asset)
            .where(
                Asset.tenant_id == tenant_id,
                Asset.business_account_id
                == business_account_id,
                Asset.status == "available",
            )
            .order_by(
                Asset.last_used_at
                .asc()
                .nulls_first(),
                Asset.created_at.asc(),
            )
        )

        if source is not None:
            query = query.where(
                Asset.source == source
            )

        assets = self.db.scalars(
            query
        ).all()

        for asset in assets:

            already_used = self.db.scalar(
                select(AssetUsage.id).where(
                    AssetUsage.asset_id
                    == asset.id,
                    AssetUsage.tenant_id
                    == tenant_id,
                    AssetUsage.status.in_(
                        [
                            "reserved",
                            "published",
                        ]
                    ),
                ).limit(1)
            )

            if already_used is None:
                return asset

        return None