# THis file is app/api/auth.py

from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
    Form,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

import secrets

from app.database.models import (
    BusinessAccount,
    Tenant,
    User,
    UserTenant,
)
from app.database.session import get_db

from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
)

from app.schemas.email_verification import (
    SignupVerificationRequest,
    SignupVerificationResponse,
    VerifySignupEmailRequest,
    VerifySignupEmailResponse,
    PasswordResetRequestSchema,
    PasswordResetVerifyRequest,
    PasswordResetVerifyResponse,
    PasswordResetCompleteRequest,
    PasswordResetCompleteResponse,
)

from app.security.authentication import (
    AuthenticatedUser,
    AuthenticationService,
)

from app.security.dependencies import (
    get_current_user,
)

from app.security.google_auth import (
    GoogleAuthenticationService,
)

from app.security.password import (
    PasswordService,
)

from app.services.email_verification_service import (
    EmailVerificationService,
)

from app.services.password_reset_service import PasswordResetService


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.get("/public-config")
def get_public_config() -> dict[str, Any]:
    from app.models.config import settings
    return {
        "google_client_id": getattr(settings, "GOOGLE_CLIENT_ID", "") or "",
    }


# ============================================================
# MANUAL SIGNUP
# ============================================================

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_200_OK,
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Directly create user account, tenant, and business account,
    returning an active JWT access token to proceed straight to onboarding.
    """
    email = EmailVerificationService._normalize_email(str(request.email))

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please sign in.",
        )

    try:
        user = User(
            email=email,
            password_hash=PasswordService.hash(request.password),
            is_active=True,
        )
        db.add(user)
        db.flush()

        tenant = Tenant(
            tenant_id=f"tenant_{secrets.token_hex(16)}",
            name=request.business_name[:255] if request.business_name else "My Business",
        )
        db.add(tenant)
        db.flush()

        membership = UserTenant(
            user_id=user.id,
            tenant_id=tenant.id,
            is_active=True,
        )
        db.add(membership)
        db.flush()

        biz = BusinessAccount(
            tenant_id=tenant.tenant_id,
            name=request.business_name[:255] if request.business_name else "Default Business",
            status="active",
        )
        db.add(biz)
        db.commit()
        db.refresh(user)
        db.refresh(biz)

        token = AuthenticationService.create_access_token(user)

        return RegisterResponse(
            access_token=token,
            token_type="bearer",
            tenant_id=tenant.tenant_id,
            business_account_id=biz.id,
            message="Account created successfully.",
        )
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to complete account registration: {str(exc)}",
        )



@router.post(
    "/signup/request-verification",
    response_model=SignupVerificationResponse,
    status_code=status.HTTP_200_OK,
)
def request_signup_verification(
    request: SignupVerificationRequest,
    db: Session = Depends(get_db),
):
    """
    Start manual signup email verification.

    The account is NOT created at this point.
    """

    try:
        EmailVerificationService.request_verification(
            db=db,
            email=str(request.email),
            password=request.password,
            name=request.name,
            business_name=request.business_name,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send email verification code.",
        )

    return SignupVerificationResponse(
        message="Verification code sent to your email address."
    )


@router.post(
    "/signup/verify",
    response_model=VerifySignupEmailResponse,
    status_code=status.HTTP_200_OK,
)
def verify_signup_email(
    request: VerifySignupEmailRequest,
    db: Session = Depends(get_db),
):
    """
    Verify the signup email address.

    Successful verification creates:

    User
    Tenant
    UserTenant

    and returns the application's JWT.
    """

    try:
        access_token, tenant_id, biz_id = EmailVerificationService.verify(
            db=db,
            email=str(request.email),
            code=request.code,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to verify email address: {str(exc)}",
        ) from None

    return VerifySignupEmailResponse(
        access_token=access_token,
        token_type="bearer",
        tenant_id=tenant_id,
        business_account_id=biz_id,
    )


# ============================================================
# PASSWORD LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate an existing password-based account.
    """

    user = db.scalar(
        select(User).where(
            User.email
            == str(request.email).strip().lower()
        )
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not PasswordService.verify(
        request.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = AuthenticationService.create_access_token(
        user
    )

    return LoginResponse(
        access_token=token,
    )




# ============================================================
# GOOGLE LOGIN
# ============================================================

@router.post(
    "/google",
    response_model=LoginResponse,
)
def google_login(
    credential: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Authenticate a user using a Google Identity Services ID token.

    Google verifies the user's identity and the backend verifies
    the ID token before issuing the application's JWT.
    """

    try:
        access_token = (
            GoogleAuthenticationService.authenticate(
                db=db,
                credential=credential,
            )
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google authentication failed.",
        ) from None

    return LoginResponse(
        access_token=access_token,
    )

# ============================================================
# PASSWORD RESET
# ============================================================

@router.post(
    "/password-reset/request",
    response_model=SignupVerificationResponse,
    status_code=status.HTTP_200_OK,
)
def request_password_reset(
    request: PasswordResetRequestSchema,
    db: Session = Depends(get_db),
):
    """
    Start password recovery.

    The response intentionally does not reveal whether
    the email belongs to an existing account.
    """

    try:
        PasswordResetService.request_reset(
            db=db,
            email=str(request.email),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process the password reset request.",
        )

    return SignupVerificationResponse(
        message=(
            "If an account exists for this email, "
            "a verification code has been sent."
        )
    )


@router.post(
    "/password-reset/verify",
    response_model=PasswordResetVerifyResponse,
    status_code=status.HTTP_200_OK,
)
def verify_password_reset(
    request: PasswordResetVerifyRequest,
    db: Session = Depends(get_db),
):
    """
    Verify the password-reset OTP and issue a short-lived
    password-reset token.
    """

    try:
        reset_token = PasswordResetService.verify_code(
            db=db,
            email=str(request.email),
            code=request.code,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to verify the password reset code.",
        )

    return PasswordResetVerifyResponse(
        reset_token=reset_token,
    )


@router.post(
    "/password-reset/complete",
    response_model=PasswordResetCompleteResponse,
    status_code=status.HTTP_200_OK,
)
def complete_password_reset(
    request: PasswordResetCompleteRequest,
    db: Session = Depends(get_db),
):
    """
    Set a new password using a verified reset token.
    """

    try:
        PasswordResetService.reset_password(
            db=db,
            email=str(request.email),
            reset_token=request.reset_token,
            new_password=request.new_password,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to reset the password.",
        )

    return PasswordResetCompleteResponse(
        message="Your password has been updated successfully.",
    )


# ============================================================
# CURRENT USER
# ============================================================


@router.get("/me")
def get_me(
    current_user: AuthenticatedUser = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Return the authenticated user's active workspace.
    """

    membership = db.scalar(
        select(UserTenant)
        .where(
            UserTenant.user_id == current_user.user_id,
            UserTenant.is_active.is_(True),
        )
        .order_by(UserTenant.id.asc())
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active workspace found.",
        )

    tenant = membership.tenant

    business_accounts = list(
        tenant.business_accounts
    )

    return {
        "user": {
            "id": current_user.user_id,
            "email": current_user.email,
        },
        "tenant": {
            "tenant_id": tenant.tenant_id,
        },
        "business_accounts": [
            {
                "id": account.id,
                "name": account.name,
            }
            for account in business_accounts
        ],
    }