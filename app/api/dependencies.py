from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import Tenant, User, UserTenant
from app.database.session import get_db
from app.security.authentication import (
    AuthenticationService,
    AuthenticatedUser,
)
from app.security.tenant import TenantContext


bearer_scheme = HTTPBearer(
    auto_error=False
)


def get_authenticated_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
) -> AuthenticatedUser:

    if credentials is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if credentials.scheme.lower() != "bearer":

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    try:

        user_id = (
            AuthenticationService
            .decode_access_token(
                credentials.credentials
            )
        )

    except Exception:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    user = db.scalar(
        select(User).where(
            User.id == user_id
        )
    )

    if user is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if not user.is_active:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    return AuthenticatedUser.from_user(
        user
    )


def get_tenant_context(
    request: Request,
    authenticated_user: AuthenticatedUser = Depends(
        get_authenticated_user
    ),
    db: Session = Depends(get_db),
) -> TenantContext:

    requested_tenant_id = request.headers.get("x-tenant-id") or request.headers.get("X-Tenant-ID")

    if requested_tenant_id:
        membership = db.scalar(
            select(UserTenant)
            .join(Tenant, Tenant.id == UserTenant.tenant_id)
            .where(
                UserTenant.user_id == authenticated_user.user_id,
                UserTenant.is_active.is_(True),
                Tenant.tenant_id == requested_tenant_id,
            )
        )
        if membership is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have active access to tenant '{requested_tenant_id}'.",
            )
        return TenantContext(tenant_id=requested_tenant_id)

    membership = db.scalar(
        select(UserTenant)
        .where(
            UserTenant.user_id
            == authenticated_user.user_id,
            UserTenant.is_active.is_(True),
        )
        .order_by(UserTenant.id)
    )

    if membership is None:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "User does not have an active "
                "tenant."
            ),
        )

    return TenantContext(
        tenant_id=membership.tenant.tenant_id
    )


def get_current_admin(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> AuthenticatedUser | None:
    if request.url.path.endswith("/admin/login") or request.url.path.endswith("/login"):
        return None

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = AuthenticationService.decode_access_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.scalar(select(User).where(User.id == user_id))
    from app.models.config import settings
    admin_email = str(getattr(settings, "SUPER_ADMIN_EMAIL", "admin@marketingsystem.com")).strip().lower()

    if user is None or not user.is_active or user.email.strip().lower() != admin_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin privileges required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthenticatedUser.from_user(user)