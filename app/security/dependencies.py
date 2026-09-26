from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import User, UserTenant
from app.database.session import get_db
from app.security.authentication import (
    AuthenticatedUser,
    AuthenticationService,
)
from app.security.tenant import TenantContext


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
) -> AuthenticatedUser:
    """
    Authenticate the request using the JWT bearer token.
    """

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme",
        )

    try:
        user_id = AuthenticationService.decode_access_token(
            credentials.credentials
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.scalar(
        select(User).where(User.id == user_id)
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )

    return AuthenticatedUser.from_user(user)


def get_current_tenant(
    tenant_id: str | None = Header(
        default=None,
        alias="X-Tenant-ID",
    ),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TenantContext:
    """
    Resolve and authorize the tenant for the authenticated user.

    The client must explicitly provide X-Tenant-ID.
    The tenant is accepted only when the authenticated user has
    an active UserTenant membership for that tenant.
    """

    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required",
        )

    membership = db.scalar(
        select(UserTenant)
        .where(
            UserTenant.user_id == current_user.user_id,
            UserTenant.tenant.has(
                tenant_id=tenant_id
            ),
            UserTenant.is_active.is_(True),
        )
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have access to this tenant",
        )

    return TenantContext(
        tenant_id=tenant_id
    )