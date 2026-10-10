from __future__ import annotations

import time
from typing import Literal
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.assets.signing import AssetURLSigner
from app.assets.storage import AssetStorageError
from app.database.models import Asset
from app.database.session import get_db
from app.models.config import settings
from app.security.dependencies import get_current_tenant
from app.security.tenant import TenantContext
from app.services.asset_service import AssetService


router = APIRouter(
    prefix="/assets",
    tags=["assets"],
)


class AssetResponse(BaseModel):
    id: str
    tenant_id: str
    original_filename: str
    mime_type: str
    source: str
    status: str
    usage_count: int
    image_url: str

    model_config = {
        "from_attributes": True,
    }


ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}

UPLOAD_CHUNK_SIZE = 1024 * 1024


def _validate_upload_metadata(
    file: UploadFile,
) -> tuple[str, str]:
    filename = (file.filename or "").strip()

    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required.",
        )

    content_type = (
        file.content_type or ""
    ).strip().lower()

    if content_type not in ALLOWED_MIME_TYPES | {"", "application/octet-stream"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Unsupported image type. "
                "Allowed: JPEG, PNG, WEBP."
            ),
        )

    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image extension.",
        )

    return filename, suffix


def _max_upload_bytes() -> int | None:
    if settings.ASSET_MAX_UPLOAD_MB is None:
        return None

    if settings.ASSET_MAX_UPLOAD_MB <= 0:
        raise ValueError(
            "ASSET_MAX_UPLOAD_MB must be greater than zero "
            "when configured."
        )

    return (
        settings.ASSET_MAX_UPLOAD_MB
        * 1024
        * 1024
    )


@router.post(
    "/upload",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_catalogue_asset(
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    file: UploadFile = File(...),
    source: Literal["catalogue", "logo"] = Query(default="catalogue"),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    db: Session = Depends(get_db),
):
    filename, suffix = _validate_upload_metadata(file)

    service = AssetService(db)

    try:
        max_upload_bytes = _max_upload_bytes()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    temp_path: Path | None = None
    total_bytes = 0

    try:
        # Validate that the Business Account belongs to
        # the authenticated tenant and is active.
        service.validate_business_account_access(
            tenant_id=tenant.tenant_id,
            business_account_id=business_account_id,
        )

        with NamedTemporaryFile(
            suffix=suffix,
            delete=False,
        ) as temp:
            temp_path = Path(temp.name)

            while True:
                chunk = file.file.read(
                    UPLOAD_CHUNK_SIZE
                )

                if not chunk:
                    break

                total_bytes += len(chunk)

                if (
                    max_upload_bytes is not None
                    and total_bytes > max_upload_bytes
                ):
                    raise HTTPException(
                        status_code=(
                            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                        ),
                        detail=(
                            "Asset exceeds the configured "
                            "maximum upload size of "
                            f"{settings.ASSET_MAX_UPLOAD_MB} MB."
                        ),
                    )

                temp.write(chunk)

        if source == "catalogue":
            # Count only products. A retry of an existing image is allowed at the limit.
            product_query = service.catalogue_statement(tenant.tenant_id, business_account_id)
            duplicate = db.scalar(product_query.where(Asset.sha256 == service._hash_file(temp_path)))
            current_count = db.scalar(select(func.count()).select_from(product_query.subquery())) or 0
            if duplicate is None and current_count >= settings.ASSET_MAX_IMAGES:
                raise HTTPException(409, "This Business Account has reached its catalogue image limit.")

        asset = service.register_file(
            tenant_id=tenant.tenant_id,
            business_account_id=business_account_id,
            source_path=temp_path,
            source=source,
            original_filename=filename,
        )

        image_url = service.build_signed_url(
            asset,
            ttl_seconds=6 * 60 * 60,
        )

        return AssetResponse(
            id=asset.id,
            tenant_id=asset.tenant_id,
            original_filename=asset.original_filename,
            mime_type=asset.mime_type,
            source=asset.source,
            status=asset.status,
            usage_count=asset.usage_count,
            image_url=image_url,
        )

    except HTTPException:
        raise

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except AssetStorageError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Asset storage operation failed.",
        ) from None

    finally:
        if temp_path is not None:
            temp_path.unlink(
                missing_ok=True
            )

        try:
            file.file.close()
        except Exception:
            pass


@router.get(
    "",
    response_model=list[AssetResponse],
)
def list_assets(
    business_account_id: int = Query(
        ...,
        gt=0,
    ),
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    db: Session = Depends(get_db),
):
    service = AssetService(db)

    try:
        service.validate_business_account_access(tenant_id=tenant.tenant_id, business_account_id=business_account_id)
    except ValueError:
        raise HTTPException(404, "Active business not found for this tenant") from None
    assets = list(db.scalars(service.catalogue_statement(tenant.tenant_id, business_account_id)
        .order_by(Asset.created_at.desc())).all())

    return [
        AssetResponse(
            id=asset.id,
            tenant_id=asset.tenant_id,
            original_filename=asset.original_filename,
            mime_type=asset.mime_type,
            source=asset.source,
            status=asset.status,
            usage_count=asset.usage_count,
            image_url=service.build_signed_url(
                asset,
                ttl_seconds=6 * 60 * 60,
            ),
        )
        for asset in assets
    ]

@router.delete(
    "/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_catalogue_asset(
    asset_id: str,
    business_account_id: int = Query(..., gt=0),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    service = AssetService(db)

    asset = db.scalar(
        select(Asset).where(
            Asset.id == asset_id,
            Asset.tenant_id == tenant.tenant_id,
            Asset.business_account_id == business_account_id,
        )
    )

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catalogue asset not found.",
        )

    if asset.status == "deleted":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catalogue asset not found.",
        )

    try:
        service.delete_asset_file(asset)
    except AssetStorageError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Asset storage operation failed.",
        ) from None

    asset.status = "deleted"
    db.commit()

    return None

@router.get(
    "/{tenant_id}/{asset_id}",
)
def serve_asset(
    tenant_id: str,
    asset_id: str,
    expires: int,
    signature: str,
    db: Session = Depends(get_db),
):
    if not AssetURLSigner.verify(
        tenant_id=tenant_id,
        asset_id=asset_id,
        expires=expires,
        signature=signature,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired asset URL.",
        )

    service = AssetService(db)

    asset = service.get_asset_for_signed_url(
        tenant_id=tenant_id,
        asset_id=asset_id,
    )

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found.",
        )

    if not service.asset_exists(asset):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset file not found.",
        )

    remaining_ttl = max(
        60,
        expires - int(time.time()),
    )

    safe_filename = (
        Path(asset.original_filename).name
    )

    return StreamingResponse(
        service.iter_asset_bytes(asset),
        media_type=asset.mime_type,
        headers={
            "Content-Disposition": (
                f'inline; filename="{safe_filename}"'
            ),
            "Cache-Control": (
                "public, "
                f"max-age={remaining_ttl}"
            ),
        },
    )
