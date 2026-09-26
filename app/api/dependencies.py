from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import User, UserTenant
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
    authenticated_user: AuthenticatedUser = Depends(
        get_authenticated_user
    ),
    db: Session = Depends(get_db),
) -> TenantContext:

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