from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.database.models import (
    Asset,
    AssetUsage,
    BrandProfile,
    BusinessAccount,
    BusinessChannel,
    BusinessProfile,
    Campaign,
    CampaignPost,
    CampaignPostPublication,
    EmailVerification,
    MarketingPreferences,
    PasswordResetRequest,
    PaymentTransaction,
    Product,
    SupportMessage,
    SupportTicket,
    TargetAudience,
    Tenant,
    TenantSubscription,
    User,
    UserTenant,
)
from app.database.session import get_db
from app.api.dependencies import get_current_admin

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    total_tenants = db.scalar(select(func.count(Tenant.id))) or 0
    total_users = db.scalar(select(func.count(User.id))) or 0
    total_businesses = db.scalar(select(func.count(BusinessAccount.id))) or 0
    active_businesses = (
        db.scalar(
            select(func.count(BusinessAccount.id)).where(
                BusinessAccount.status == "active"
            )
        )
        or 0
    )
    total_campaigns = db.scalar(select(func.count(Campaign.id))) or 0
    active_campaigns = (
        db.scalar(
            select(func.count(Campaign.id)).where(
                Campaign.status.in_(["active", "scheduled", "draft"])
            )
        )
        or 0
    )
    total_posts = db.scalar(select(func.count(CampaignPost.id))) or 0
    published_posts = (
        db.scalar(
            select(func.count(CampaignPost.id)).where(
                CampaignPost.publish_status == "published"
            )
        )
        or 0
    )
    total_channels = db.scalar(select(func.count(BusinessChannel.id))) or 0

    return {
        "status": "ok",
        "stats": {
            "total_tenants": total_tenants,
            "total_users": total_users,
            "total_businesses": total_businesses,
            "active_businesses": active_businesses,
            "total_campaigns": total_campaigns,
            "active_campaigns": active_campaigns,
            "total_posts": total_posts,
            "published_posts": published_posts,
            "total_channels": total_channels,
            "system_health": "healthy",
        },
    }


@router.get("/users")
def get_admin_users(
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    users = db.scalars(select(User).order_by(User.id.desc())).all()
    result = []
    for u in users:
        company_names = []
        tenant_ids = []
        total_campaigns = 0
        for ut in u.tenants:
            if ut.tenant:
                tenant_ids.append(ut.tenant.tenant_id)
                bp = db.scalar(
                    select(BusinessProfile).where(
                        BusinessProfile.tenant_id == ut.tenant.tenant_id
                    )
                )
                if bp and bp.business_name:
                    company_names.append(bp.business_name)
                elif ut.tenant.name:
                    company_names.append(ut.tenant.name)

                c_cnt = (
                    db.scalar(
                        select(func.count(Campaign.id)).where(
                            Campaign.tenant_id == ut.tenant.tenant_id
                        )
                    )
                    or 0
                )
                total_campaigns += c_cnt

        company_str = ", ".join(company_names) if company_names else "Personal Workspace"
        email_prefix = u.email.split("@")[0].replace(".", " ").replace("_", " ").title()

        result.append(
            {
                "id": f"USR-{u.id:04d}",
                "raw_id": u.id,
                "name": email_prefix,
                "email": u.email,
                "company": company_str,
                "plan": "Free",
                "status": "Active" if u.is_active else "Suspended",
                "role": "Owner",
                "campaigns": total_campaigns,
                "joined": u.created_at.strftime("%b %d, %Y") if u.created_at else "Recent",
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "lastActive": "Recently active",
                "is_active": u.is_active,
                "tenants": tenant_ids,
            }
        )
    return result


@router.get("/users/{user_id}")
def get_admin_user_detail(
    user_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    raw_id = None
    if user_id.startswith("USR-"):
        try:
            raw_id = int(user_id.replace("USR-", ""))
        except ValueError:
            pass
    elif user_id.isdigit():
        raw_id = int(user_id)

    query = select(User)
    if raw_id is not None:
        query = query.where(User.id == raw_id)
    else:
        query = query.where(User.email == user_id)

    u = db.scalar(query)
    if not u:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    tenant_ids = []
    company_names = []
    total_campaigns = 0
    businesses = []

    for ut in u.tenants:
        if ut.tenant:
            tenant_ids.append(ut.tenant.tenant_id)
            bp = db.scalar(
                select(BusinessProfile).where(
                    BusinessProfile.tenant_id == ut.tenant.tenant_id
                )
            )
            c_cnt = (
                db.scalar(
                    select(func.count(Campaign.id)).where(
                        Campaign.tenant_id == ut.tenant.tenant_id
                    )
                )
                or 0
            )
            total_campaigns += c_cnt

            b_name = bp.business_name if bp and bp.business_name else ut.tenant.name
            company_names.append(b_name)

            ba = db.scalar(
                select(BusinessAccount).where(
                    BusinessAccount.tenant_id == ut.tenant.tenant_id
                )
            )
            businesses.append(
                {
                    "id": f"BUS-{ba.id:04d}" if ba else "BUS-0000",
                    "tenant_id": ut.tenant.tenant_id,
                    "name": b_name,
                    "category": bp.category if bp and bp.category else "General",
                    "campaigns": c_cnt,
                    "status": "Active" if (ba and ba.status == "active") else "Trial",
                }
            )

    total_posts = (
        db.scalar(
            select(func.count(CampaignPost.id)).where(
                CampaignPost.tenant_id.in_(tenant_ids)
            )
        )
        if tenant_ids
        else 0
    ) or 0

    company_str = ", ".join(company_names) if company_names else "Personal Workspace"
    email_prefix = u.email.split("@")[0].replace(".", " ").replace("_", " ").title()

    activities = []
    if tenant_ids:
        recent_c = db.scalars(
            select(Campaign)
            .where(Campaign.tenant_id.in_(tenant_ids))
            .order_by(Campaign.id.desc())
            .limit(5)
        ).all()
        for rc in recent_c:
            activities.append(
                {
                    "title": f"Campaign: {rc.title}",
                    "description": f"Status: {rc.status} • Mode: {rc.execution_mode or 'Default'}",
                    "time": rc.created_at.strftime("%b %d, %Y") if rc.created_at else "Recently",
                }
            )

    if not activities:
        activities.append(
            {
                "title": "Account Registered",
                "description": f"User joined platform with email {u.email}",
                "time": u.created_at.strftime("%b %d, %Y") if u.created_at else "Recent",
            }
        )

    return {
        "id": f"USR-{u.id:04d}",
        "raw_id": u.id,
        "name": email_prefix,
        "email": u.email,
        "phone": "+91 (Not Provided)",
        "company": company_str,
        "plan": "Free",
        "status": "Active" if u.is_active else "Suspended",
        "role": "Owner",
        "campaigns": total_campaigns,
        "totalPosts": total_posts,
        "connectedAccounts": len(businesses),
        "monthlySpend": "₹0",
        "joined": u.created_at.strftime("%B %d, %Y") if u.created_at else "Recent",
        "lastActive": "Recently active",
        "is_active": u.is_active,
        "businesses": businesses,
        "recentActivity": activities,
    }


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return {
        "status": "ok",
        "user_id": user.id,
        "is_active": user.is_active,
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    user_email = user.email

    # Collect all tenants linked to this user
    user_tenants = db.scalars(
        select(UserTenant).where(UserTenant.user_id == user_id)
    ).all()

    tenant_internal_ids = [ut.tenant_id for ut in user_tenants]
    tenant_obj_ids = [ut.tenant.tenant_id for ut in user_tenants if ut.tenant]

    if tenant_obj_ids:
        # 1. Support messages & tickets
        tickets = db.scalars(
            select(SupportTicket).where(
                (SupportTicket.tenant_id.in_(tenant_obj_ids))
                | (SupportTicket.user_id == user_id)
            )
        ).all()
        ticket_ids = [t.id for t in tickets]
        if ticket_ids:
            db.execute(
                delete(SupportMessage).where(
                    SupportMessage.ticket_id.in_(ticket_ids)
                )
            )
        db.execute(
            delete(SupportMessage).where(SupportMessage.sender_user_id == user_id)
        )
        if ticket_ids:
            db.execute(
                delete(SupportTicket).where(SupportTicket.id.in_(ticket_ids))
            )
        db.execute(
            delete(SupportTicket).where(
                (SupportTicket.tenant_id.in_(tenant_obj_ids))
                | (SupportTicket.user_id == user_id)
            )
        )

        # 2. Payments & Subscriptions
        db.execute(
            delete(PaymentTransaction).where(
                (PaymentTransaction.tenant_id.in_(tenant_obj_ids))
                | (PaymentTransaction.user_id == user_id)
            )
        )
        db.execute(
            delete(TenantSubscription).where(
                TenantSubscription.tenant_id.in_(tenant_obj_ids)
            )
        )

        # 3. Campaigns & Posts
        campaigns = db.scalars(
            select(Campaign).where(Campaign.tenant_id.in_(tenant_obj_ids))
        ).all()
        campaign_ids = [c.id for c in campaigns]

        posts = db.scalars(
            select(CampaignPost).where(
                (CampaignPost.tenant_id.in_(tenant_obj_ids))
                | (CampaignPost.campaign_id.in_(campaign_ids))
            )
        ).all()
        post_ids = [p.id for p in posts]

        db.execute(
            delete(CampaignPostPublication).where(
                CampaignPostPublication.tenant_id.in_(tenant_obj_ids)
            )
        )
        if post_ids:
            db.execute(
                delete(CampaignPostPublication).where(
                    CampaignPostPublication.campaign_post_id.in_(post_ids)
                )
            )
        if post_ids:
            db.execute(
                delete(CampaignPost).where(CampaignPost.id.in_(post_ids))
            )
        if campaign_ids:
            db.execute(
                delete(Campaign).where(Campaign.id.in_(campaign_ids))
            )

        # 4. Marketing profiles & settings
        db.execute(
            delete(MarketingPreferences).where(
                MarketingPreferences.tenant_id.in_(tenant_obj_ids)
            )
        )
        db.execute(
            delete(TargetAudience).where(
                TargetAudience.tenant_id.in_(tenant_obj_ids)
            )
        )
        db.execute(
            delete(Product).where(Product.tenant_id.in_(tenant_obj_ids))
        )
        db.execute(
            delete(BrandProfile).where(
                BrandProfile.tenant_id.in_(tenant_obj_ids)
            )
        )
        db.execute(
            delete(BusinessProfile).where(
                BusinessProfile.tenant_id.in_(tenant_obj_ids)
            )
        )

        # 5. Assets
        assets = db.scalars(
            select(Asset).where(Asset.tenant_id.in_(tenant_obj_ids))
        ).all()
        asset_ids = [a.id for a in assets]
        if asset_ids:
            db.execute(
                delete(AssetUsage).where(AssetUsage.asset_id.in_(asset_ids))
            )
            db.execute(delete(Asset).where(Asset.id.in_(asset_ids)))

        # 6. Channels and Business Accounts
        db.execute(
            delete(BusinessChannel).where(
                BusinessChannel.tenant_id.in_(tenant_obj_ids)
            )
        )
        db.execute(
            delete(BusinessAccount).where(
                BusinessAccount.tenant_id.in_(tenant_obj_ids)
            )
        )

        # 7. Tenants and UserTenants
        db.execute(
            delete(UserTenant).where(
                (UserTenant.user_id == user_id)
                | (UserTenant.tenant_id.in_(tenant_internal_ids))
            )
        )
        db.execute(
            delete(Tenant).where(
                (Tenant.id.in_(tenant_internal_ids))
                | (Tenant.tenant_id.in_(tenant_obj_ids))
            )
        )
    else:
        # Fallback cleanup when user has no tenants attached
        db.execute(
            delete(SupportMessage).where(SupportMessage.sender_user_id == user_id)
        )
        db.execute(
            delete(SupportTicket).where(SupportTicket.user_id == user_id)
        )
        db.execute(
            delete(PaymentTransaction).where(PaymentTransaction.user_id == user_id)
        )
        db.execute(
            delete(UserTenant).where(UserTenant.user_id == user_id)
        )

    # 8. Verifications & Reset tokens
    db.execute(
        delete(EmailVerification).where(EmailVerification.email == user_email)
    )
    db.execute(
        delete(PasswordResetRequest).where(PasswordResetRequest.email == user_email)
    )

    # 9. Delete the User
    db.delete(user)
    db.commit()

    return {
        "status": "ok",
        "message": f"User {user_email} and all associated businesses and records have been deleted.",
        "user_id": user_id,
    }


@router.get("/businesses")
def get_admin_businesses(
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    accounts = db.scalars(
        select(BusinessAccount).order_by(BusinessAccount.id.desc())
    ).all()
    result = []
    for acc in accounts:
        owner_email = "owner@business.com"
        t = db.scalar(select(Tenant).where(Tenant.tenant_id == acc.tenant_id))
        if t and t.users and t.users[0].user:
            owner_email = t.users[0].user.email

        bp = db.scalar(
            select(BusinessProfile).where(
                BusinessProfile.tenant_id == acc.tenant_id
            )
        )
        biz_name = bp.business_name if bp and bp.business_name else acc.name
        category = bp.category if bp and bp.category else "General"

        campaigns_count = (
            db.scalar(
                select(func.count(Campaign.id)).where(
                    Campaign.tenant_id == acc.tenant_id
                )
            )
            or 0
        )
        products_count = (
            db.scalar(
                select(func.count(CampaignPost.id)).where(
                    CampaignPost.tenant_id == acc.tenant_id
                )
            )
            or 0
        )

        channels = [
            {
                "id": ch.id,
                "platform": ch.platform,
                "account_name": ch.account_name,
                "external_account_id": ch.external_account_id,
                "status": ch.status,
            }
            for ch in acc.channels
        ]
        result.append(
            {
                "id": f"BUS-{acc.id:04d}",
                "raw_id": acc.id,
                "name": biz_name,
                "owner": owner_email.split("@")[0].replace(".", " ").title(),
                "email": owner_email,
                "category": category,
                "plan": "Free",
                "status": "Active" if acc.status == "active" else "Trial",
                "campaigns": campaigns_count,
                "users": 1,
                "products": products_count,
                "created": acc.created_at.strftime("%b %d, %Y") if acc.created_at else "Recent",
                "lastActive": "Recently active",
                "tenant_id": acc.tenant_id,
                "channels": channels,
            }
        )
    return result


@router.get("/businesses/{business_id}")
def get_admin_business_detail(
    business_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    raw_id = None
    if business_id.startswith("BUS-"):
        try:
            raw_id = int(business_id.replace("BUS-", ""))
        except ValueError:
            pass
    elif business_id.isdigit():
        raw_id = int(business_id)

    query = select(BusinessAccount)
    if raw_id is not None:
        query = query.where(BusinessAccount.id == raw_id)
    else:
        query = query.where(BusinessAccount.tenant_id == business_id)

    acc = db.scalar(query)
    if not acc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )

    owner_name = "Business Owner"
    owner_email = "owner@business.com"
    owner_user_id = None
    t = db.scalar(select(Tenant).where(Tenant.tenant_id == acc.tenant_id))
    if t and t.users and t.users[0].user:
        u = t.users[0].user
        owner_email = u.email
        owner_name = u.email.split("@")[0].replace(".", " ").title()
        owner_user_id = u.id

    bp = db.scalar(
        select(BusinessProfile).where(
            BusinessProfile.tenant_id == acc.tenant_id
        )
    )
    biz_name = bp.business_name if bp and bp.business_name else acc.name
    category = bp.category if bp and bp.category else "General"
    description = (
        bp.description
        if bp and bp.description
        else f"Digital marketing account for {biz_name}."
    )
    website = bp.website if bp and bp.website else ""
    country = bp.country if bp and bp.country else "India"
    city = bp.city if bp and bp.city else "Not specified"
    location = f"{city}, {country}" if city != "Not specified" else country

    campaigns_count = (
        db.scalar(
            select(func.count(Campaign.id)).where(
                Campaign.tenant_id == acc.tenant_id
            )
        )
        or 0
    )
    products_count = (
        db.scalar(
            select(func.count(CampaignPost.id)).where(
                CampaignPost.tenant_id == acc.tenant_id
            )
        )
        or 0
    )

    channels = [
        {
            "id": ch.id,
            "platform": ch.platform,
            "name": ch.platform.title(),
            "account_name": ch.account_name,
            "handle": f"@{ch.account_name}" if ch.account_name else "",
            "connected": ch.status == "connected",
            "external_account_id": ch.external_account_id,
            "status": ch.status,
        }
        for ch in acc.channels
    ]

    return {
        "id": f"BUS-{acc.id:04d}",
        "raw_id": acc.id,
        "name": biz_name,
        "owner": owner_name,
        "owner_user_id": owner_user_id,
        "email": owner_email,
        "phone": "+91 (Not Provided)",
        "website": website or f"{biz_name.lower().replace(' ', '')}.example.com",
        "plan": "Free",
        "status": "Active" if acc.status == "active" else "Trial",
        "created": acc.created_at.strftime("%B %d, %Y") if acc.created_at else "Recent",
        "lastActive": "Recently active",
        "industry": category,
        "category": category,
        "location": location,
        "description": description,
        "campaigns": campaigns_count,
        "users": 1,
        "products": products_count,
        "tenant_id": acc.tenant_id,
        "channels": channels,
    }


@router.get("/campaigns")
def get_admin_campaigns(
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    campaigns = db.scalars(
        select(Campaign).order_by(Campaign.id.desc())
    ).all()
    result = []
    for c in campaigns:
        posts_count = (
            db.scalar(
                select(func.count(CampaignPost.id)).where(
                    CampaignPost.campaign_id == c.id
                )
            )
            or 0
        )
        result.append(
            {
                "id": c.id,
                "tenant_id": c.tenant_id,
                "business_account_id": c.business_account_id,
                "campaign_name": c.campaign_name,
                "execution_mode": c.execution_mode,
                "status": c.status,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "started_at": c.started_at.isoformat() if c.started_at else None,
                "posts_count": posts_count,
            }
        )
    return result


@router.get("/audit-logs")
def get_admin_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    pubs = db.scalars(
        select(CampaignPostPublication)
        .order_by(CampaignPostPublication.id.desc())
        .limit(limit)
    ).all()
    result = []
    for p in pubs:
        result.append(
            {
                "id": p.id,
                "tenant_id": p.tenant_id,
                "campaign_post_id": p.campaign_post_id,
                "platform": p.platform,
                "status": p.status,
                "external_id": p.external_id,
                "last_error": p.last_error,
                "started_at": p.started_at.isoformat() if p.started_at else None,
                "completed_at": p.completed_at.isoformat() if p.completed_at else None,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
        )
    return result


import os
import secrets
from pydantic import BaseModel, EmailStr, SecretStr

class AdminLoginRequest(BaseModel):
    email: str
    password: str
    security_pin: str

class TestEmailRequest(BaseModel):
    recipient_email: EmailStr

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_ENV_PATH = os.path.join(BASE_DIR, ".env")

def update_env_file(updates: dict[str, str], env_path: str = DEFAULT_ENV_PATH) -> None:
    if not os.path.exists(env_path):
        lines = []
    else:
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

    existing_keys = set()
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            key, _ = stripped.split("=", 1)
            key = key.strip()
            existing_keys.add(key)
            if key in updates:
                new_lines.append(f"{key}={updates[key]}\n")
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)

    for k, v in updates.items():
        if k not in existing_keys:
            new_lines.append(f"{k}={v}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)


@router.post("/login")
def admin_login(
    request: AdminLoginRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    from app.models.config import settings
    from app.security.authentication import AuthenticationService
    from app.security.password import PasswordService

    raw_email = getattr(settings, "SUPER_ADMIN_EMAIL", "admin@marketingsystem.com")
    raw_pass = getattr(settings, "SUPER_ADMIN_PASSWORD", "Admin@12345")
    raw_pin = getattr(settings, "SUPER_ADMIN_PIN", "984102")

    admin_email = str(raw_email).strip().lower()
    admin_pass = raw_pass.get_secret_value() if hasattr(raw_pass, "get_secret_value") else str(raw_pass)
    admin_pin = raw_pin.get_secret_value() if hasattr(raw_pin, "get_secret_value") else str(raw_pin)

    if (
        request.email.strip().lower() != admin_email
        or request.password != admin_pass
        or request.security_pin.strip() != admin_pin
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Super Admin credentials or security PIN.",
        )

    admin_user = db.scalar(select(User).where(User.email == admin_email))
    if not admin_user:
        admin_user = User(
            email=admin_email,
            password_hash=PasswordService.hash(admin_pass),
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    access_token = AuthenticationService.create_access_token(admin_user)

    return {
        "status": "ok",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": f"USR-{admin_user.id:04d}",
            "name": "Super Administrator",
            "email": admin_user.email,
            "role": "super_admin",
            "permissions": [
                "all",
                "settings.read",
                "settings.update",
                "system.manage",
            ],
        },
    }


@router.get("/settings")
def get_admin_system_settings() -> dict[str, Any]:
    from app.models.config import settings

    def mask(val: Any) -> str:
        if not val:
            return ""
        s = str(val.get_secret_value() if hasattr(val, "get_secret_value") else val)
        if len(s) <= 8:
            return "••••••••"
        return s[:4] + "••••••••" + s[-4:]

    return {
        "status": "ok",
        "env_settings": {
            "email": {
                "EMAIL_PROVIDER": getattr(settings, "EMAIL_PROVIDER", "console"),
                "SMTP_HOST": getattr(settings, "SMTP_HOST", "") or "",
                "SMTP_PORT": getattr(settings, "SMTP_PORT", 587) or 587,
                "SMTP_USER": getattr(settings, "SMTP_USER", "") or "",
                "SMTP_PASSWORD": mask(getattr(settings, "SMTP_PASSWORD", None)),
                "EMAIL_FROM": getattr(settings, "EMAIL_FROM", "") or "",
                "EMAIL_FROM_NAME": getattr(settings, "EMAIL_FROM_NAME", "") or "",
                "SMTP_USE_TLS": getattr(settings, "SMTP_USE_TLS", True),
                "RESEND_API_KEY": mask(getattr(settings, "RESEND_API_KEY", None)),
            },
            "ai_models": {
                "HF_TOKEN": mask(getattr(settings, "HF_TOKEN", None)),
                "OPENAI_API_KEY": mask(getattr(settings, "OPENAI_API_KEY", None)),
                "ANTHROPIC_API_KEY": mask(getattr(settings, "ANTHROPIC_API_KEY", None)),
                "GEMINI_API_KEY": mask(getattr(settings, "GEMINI_API_KEY", None)),
                "STABILITY_API_KEY": mask(getattr(settings, "STABILITY_API_KEY", None)),
                "TEXT_MODEL_PROVIDER": getattr(settings, "TEXT_MODEL_PROVIDER", "huggingface"),
                "TEXT_MODEL_ALIAS": getattr(settings, "TEXT_MODEL_ALIAS", "default_chat"),
                "IMAGE_MODEL_PROVIDER": getattr(settings, "IMAGE_MODEL_PROVIDER", "huggingface"),
                "IMAGE_MODEL": getattr(settings, "IMAGE_MODEL", "black-forest-labs/FLUX.1-schnell"),
            },
            "payments": {
                "RAZORPAY_KEY_ID": getattr(settings, "RAZORPAY_KEY_ID", "") or "",
                "RAZORPAY_KEY_SECRET": mask(getattr(settings, "RAZORPAY_KEY_SECRET", None)),
                "RAZORPAY_WEBHOOK_SECRET": mask(getattr(settings, "RAZORPAY_WEBHOOK_SECRET", None)),
            },
            "meta": {
                "META_APP_ID": getattr(settings, "META_APP_ID", "") or "",
                "META_APP_SECRET": mask(getattr(settings, "META_APP_SECRET", None)),
                "META_REDIRECT_URI": getattr(settings, "META_REDIRECT_URI", "") or "",
                "META_CONFIG_ID": getattr(settings, "META_CONFIG_ID", "") or "",
            },
            "google": {
                "GOOGLE_CLIENT_ID": getattr(settings, "GOOGLE_CLIENT_ID", "") or "",
                "GOOGLE_CLIENT_SECRET": mask(getattr(settings, "GOOGLE_CLIENT_SECRET", None)),
                "GOOGLE_REDIRECT_URI": getattr(settings, "GOOGLE_REDIRECT_URI", "") or "",
                "GOOGLE_BUSINESS_REDIRECT_URI": getattr(settings, "GOOGLE_BUSINESS_REDIRECT_URI", "") or "",
            },
            "linkedin": {
                "LINKEDIN_CLIENT_ID": getattr(settings, "LINKEDIN_CLIENT_ID", "") or "",
                "LINKEDIN_CLIENT_SECRET": mask(getattr(settings, "LINKEDIN_CLIENT_SECRET", None)),
                "LINKEDIN_REDIRECT_URI": getattr(settings, "LINKEDIN_REDIRECT_URI", "") or "",
            },
            "research": {
                "DATAFORSEO_LOGIN": getattr(settings, "DATAFORSEO_LOGIN", "") or "",
                "DATAFORSEO_PASSWORD": mask(getattr(settings, "DATAFORSEO_PASSWORD", None)),
                "TAVILY_API_KEY": mask(getattr(settings, "TAVILY_API_KEY", None)),
                "FIRECRAWL_API_KEY": mask(getattr(settings, "FIRECRAWL_API_KEY", None)),
            },
            "security": {
                "SUPER_ADMIN_EMAIL": getattr(settings, "SUPER_ADMIN_EMAIL", "admin@marketingsystem.com"),
                "SUPER_ADMIN_PASSWORD": mask(getattr(settings, "SUPER_ADMIN_PASSWORD", "Admin@12345")),
                "SUPER_ADMIN_PIN": mask(getattr(settings, "SUPER_ADMIN_PIN", "984102")),
                "JWT_SECRET_KEY": mask(getattr(settings, "JWT_SECRET_KEY", None)),
            },
        },
    }


@router.post("/settings")
def update_admin_system_settings(payload: dict[str, Any]) -> dict[str, Any]:
    raise HTTPException(410, "Use section-specific settings endpoints. Bulk environment updates are disabled to prevent unrelated key overwrites.")


@router.post("/test-email")
def test_email(request: TestEmailRequest) -> dict[str, Any]:
    from app.services.email_service import EmailService

    try:
        EmailService.send_test_email(str(request.recipient_email))
        return {
            "status": "ok",
            "message": f"Test verification email sent successfully to {request.recipient_email}!",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SMTP Delivery Failed: {str(exc)}",
        )


class TestAIConnectionRequest(BaseModel):
    provider: str
    api_key: str | None = None
    type: str = "text"
    model: str | None = None


@router.post("/ai/test-connection")
async def test_ai_connection(request: TestAIConnectionRequest) -> dict[str, Any]:
    import time
    import httpx
    from app.models.config import settings

    provider = (request.provider or "").strip().lower()
    raw_key = (request.api_key or "").strip()
    ai_type = (request.type or "text").strip().lower()
    model = (request.model or "").strip()

    # If key wasn't provided in request, fallback to configured settings
    if not raw_key or "••••" in raw_key or "****" in raw_key:
        if provider == "openai":
            raw_key = settings.OPENAI_API_KEY.get_secret_value() if hasattr(settings.OPENAI_API_KEY, "get_secret_value") else str(settings.OPENAI_API_KEY or "")
        elif provider == "gemini":
            raw_key = settings.GEMINI_API_KEY.get_secret_value() if hasattr(settings.GEMINI_API_KEY, "get_secret_value") else str(settings.GEMINI_API_KEY or "")
        elif provider == "anthropic":
            raw_key = settings.ANTHROPIC_API_KEY.get_secret_value() if hasattr(settings.ANTHROPIC_API_KEY, "get_secret_value") else str(settings.ANTHROPIC_API_KEY or "")
        elif provider == "huggingface":
            raw_key = settings.HF_TOKEN.get_secret_value() if hasattr(settings.HF_TOKEN, "get_secret_value") else str(settings.HF_TOKEN or "")
        elif provider == "stability":
            raw_key = settings.STABILITY_API_KEY.get_secret_value() if hasattr(settings.STABILITY_API_KEY, "get_secret_value") else str(settings.STABILITY_API_KEY or "")
        elif provider == "tavily":
            raw_key = settings.TAVILY_API_KEY.get_secret_value() if hasattr(settings.TAVILY_API_KEY, "get_secret_value") else str(settings.TAVILY_API_KEY or "")
        elif provider == "firecrawl":
            raw_key = settings.FIRECRAWL_API_KEY.get_secret_value() if hasattr(settings.FIRECRAWL_API_KEY, "get_secret_value") else str(settings.FIRECRAWL_API_KEY or "")

    if not raw_key:
        return {
            "success": False,
            "message": f"API Key for '{provider}' is missing. Please enter a valid API key.",
        }

    start_t = time.time()

    try:
        if provider == "openai":
            from openai import OpenAI
            client = OpenAI(api_key=raw_key)
            if ai_type == "image":
                # For DALL-E test, ping models list to avoid spending image credits
                client.models.retrieve("dall-e-3")
                elapsed = round((time.time() - start_t) * 1000)
                return {"success": True, "latency_ms": elapsed, "message": "Connected to OpenAI DALL-E 3 successfully!"}
            else:
                target_model = model or "gpt-4o-mini"
                resp = client.chat.completions.create(
                    model=target_model,
                    messages=[{"role": "user", "content": "ping"}],
                    max_tokens=3,
                )
                elapsed = round((time.time() - start_t) * 1000)
                return {"success": True, "latency_ms": elapsed, "message": f"Connected to OpenAI ({target_model}) in {elapsed}ms!"}

        elif provider == "gemini":
            target_model = (model or "").strip()
            if not target_model or target_model.lower() in ("default_chat", "fast_chat", "default", "none"):
                target_model = "gemini-3.8-flash"
            elif target_model.lower() == "reasoning":
                target_model = "gemini-1.5-pro"

            models_to_try = [target_model, "gemini-3.8-flash", "gemini-1.5-flash", "gemini-2.0-flash"]
            last_err = ""
            for m in dict.fromkeys(models_to_try):
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={raw_key}"
                payload = {"contents": [{"parts": [{"text": "ping"}]}], "generationConfig": {"maxOutputTokens": 3}}
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        elapsed = round((time.time() - start_t) * 1000)
                        return {"success": True, "latency_ms": elapsed, "message": f"Connected to Google Gemini ({m}) in {elapsed}ms!"}
                    last_err = f"Gemini Error ({resp.status_code}): {resp.text}"
            return {"success": False, "message": last_err}

        elif provider == "anthropic":
            target_model = model or "claude-3-5-haiku-20241022"
            url = "https://api.anthropic.com/v1/messages"
            headers = {"x-api-key": raw_key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
            payload = {"model": target_model, "messages": [{"role": "user", "content": "ping"}], "max_tokens": 3}
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code != 200:
                    return {"success": False, "message": f"Anthropic Error ({resp.status_code}): {resp.text}"}
            elapsed = round((time.time() - start_t) * 1000)
            return {"success": True, "latency_ms": elapsed, "message": f"Connected to Anthropic ({target_model}) in {elapsed}ms!"}

        elif provider == "huggingface":
            from huggingface_hub import InferenceClient
            client = InferenceClient(api_key=raw_key)
            if ai_type == "image":
                target_model = model or "black-forest-labs/FLUX.1-schnell"
                # Test with prompt
                client.text_to_image("coffee", model=target_model)
                elapsed = round((time.time() - start_t) * 1000)
                return {"success": True, "latency_ms": elapsed, "message": f"Connected to HuggingFace FLUX ({target_model}) in {elapsed}ms!"}
            else:
                target_model = model or "meta-llama/Llama-3.1-8B-Instruct"
                client.chat.completions.create(model=target_model, messages=[{"role": "user", "content": "ping"}], max_tokens=3)
                elapsed = round((time.time() - start_t) * 1000)
                return {"success": True, "latency_ms": elapsed, "message": f"Connected to HuggingFace Llama ({target_model}) in {elapsed}ms!"}

        elif provider == "stability":
            url = "https://api.stability.ai/v1/user/account"
            headers = {"Authorization": f"Bearer {raw_key}"}
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    return {"success": False, "message": f"Stability AI Error ({resp.status_code}): {resp.text}"}
            elapsed = round((time.time() - start_t) * 1000)
            return {"success": True, "latency_ms": elapsed, "message": f"Connected to Stability AI in {elapsed}ms!"}

        elif provider == "tavily":
            url = "https://api.tavily.com/search"
            payload = {"api_key": raw_key, "query": "ping", "max_results": 1}
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code != 200:
                    return {"success": False, "message": f"Tavily Error ({resp.status_code}): {resp.text}"}
            elapsed = round((time.time() - start_t) * 1000)
            return {"success": True, "latency_ms": elapsed, "message": f"Connected to Tavily AI Search in {elapsed}ms!"}

        elif provider == "firecrawl":
            url = "https://api.firecrawl.dev/v1/scrape"
            headers = {"Authorization": f"Bearer {raw_key}"}
            payload = {"url": "https://example.com"}
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code not in (200, 201):
                    return {"success": False, "message": f"Firecrawl Error ({resp.status_code}): {resp.text}"}
            elapsed = round((time.time() - start_t) * 1000)
            return {"success": True, "latency_ms": elapsed, "message": f"Connected to Firecrawl in {elapsed}ms!"}

        else:
            return {"success": False, "message": f"Unknown provider '{provider}'."}

    except Exception as exc:
        return {"success": False, "message": f"Connection test failed: {str(exc)}"}


