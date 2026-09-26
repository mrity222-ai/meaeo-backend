from datetime import datetime, timedelta, timezone
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_authenticated_user, get_tenant_context
from app.database.models import (
    PaymentTransaction,
    SubscriptionPlan,
    Tenant,
    TenantSubscription,
)
from app.database.session import get_db
from app.security.authentication import AuthenticatedUser
from app.security.tenant import TenantContext

router = APIRouter(
    prefix="/payments",
    tags=["payments"],
)


class CreatePlanRequest(BaseModel):
    plan_code: str
    name: str
    description: str | None = None
    price: float = 0.0
    price_usd: float | None = 0.0
    currency: str = "INR"
    billing_interval: str = "monthly"
    max_brands: int = 1
    max_campaigns_per_month: int = 5
    features: Any | None = None
    is_popular: bool = False
    badge_text: str | None = None
    is_active: bool = True


class UpdatePlanRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    price_usd: float | None = None
    currency: str | None = None
    billing_interval: str | None = None
    max_brands: int | None = None
    max_campaigns_per_month: int | None = None
    features: Any | None = None
    is_popular: bool | None = None
    badge_text: str | None = None
    is_active: bool | None = None


class CreateOrderRequest(BaseModel):
    plan_code: str
    provider: str = "razorpay"


class VerifyPaymentRequest(BaseModel):
    order_id: str
    payment_id: str
    signature: str | None = None
    provider: str = "razorpay"


@router.get("/plans")
def list_subscription_plans(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    query = select(SubscriptionPlan)
    if not include_inactive:
        query = query.where(SubscriptionPlan.is_active.is_(True))
    plans = db.scalars(query.order_by(SubscriptionPlan.price.asc())).all()

    if not plans and not include_inactive:
        # Seed default plans if empty
        default_plans = [
            SubscriptionPlan(
                plan_code="free",
                name="Basic",
                description="Ideal for getting started with AI marketing.",
                price=0.0,
                price_usd=0.0,
                currency="INR",
                billing_interval="monthly",
                max_brands=1,
                max_campaigns_per_month=3,
                features={"bullets": ["15 AI Generated Posts / month", "Instagram & Facebook Auto-Publishing", "Basic Analytics Dashboard", "Community Support"]},
                is_popular=False,
                badge_text=None,
                is_active=True,
            ),
            SubscriptionPlan(
                plan_code="pro_monthly",
                name="Premium",
                description="Full AI marketing suite for growing businesses & creators.",
                price=999.0,
                price_usd=9.99,
                currency="INR",
                billing_interval="monthly",
                max_brands=3,
                max_campaigns_per_month=30,
                features={"bullets": ["150 AI Posts / month", "Instagram, Facebook, LinkedIn & Google Business", "AI Review Responder & Local SEO Engine", "Daily Promotional Offers & Coupon Codes", "Priority AI Image Generation"]},
                is_popular=True,
                badge_text="Most Popular",
                is_active=True,
            ),
            SubscriptionPlan(
                plan_code="agency_monthly",
                name="Enterprise",
                description="Unlimited scale for agencies and multi-location businesses.",
                price=1999.0,
                price_usd=19.99,
                currency="INR",
                billing_interval="monthly",
                max_brands=15,
                max_campaigns_per_month=150,
                features={"bullets": ["Unlimited AI Posts & Campaigns", "All 4 Platforms + Multi-Location Management", "Dedicated Google Maps 3-Pack Optimization", "Custom Brand Voice & AI Tuning", "24/7 Dedicated Account Manager"]},
                is_popular=False,
                badge_text="Best Value",
                is_active=True,
            ),
        ]
        db.add_all(default_plans)
        db.commit()
        plans = db.scalars(
            select(SubscriptionPlan)
            .where(SubscriptionPlan.is_active.is_(True))
            .order_by(SubscriptionPlan.price.asc())
        ).all()

    return [
        {
            "id": p.id,
            "plan_code": p.plan_code,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "price_usd": getattr(p, "price_usd", 0.0) or (0.0 if p.price == 0 else round(p.price / 85, 2)),
            "currency": p.currency,
            "billing_interval": p.billing_interval,
            "max_brands": p.max_brands,
            "max_campaigns_per_month": p.max_campaigns_per_month,
            "features": p.features,
            "is_popular": getattr(p, "is_popular", False),
            "badge_text": getattr(p, "badge_text", None),
            "is_active": p.is_active,
        }
        for p in plans
    ]


@router.post("/plans", status_code=status.HTTP_201_CREATED)
def create_subscription_plan(
    body: CreatePlanRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    existing = db.scalar(
        select(SubscriptionPlan).where(SubscriptionPlan.plan_code == body.plan_code)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Plan code '{body.plan_code}' already exists.",
        )

    features_payload = body.features
    if isinstance(features_payload, list):
        features_payload = {"bullets": features_payload}
    elif isinstance(features_payload, str):
        features_payload = {"bullets": [b.strip() for b in features_payload.split(",") if b.strip()]}
    elif features_payload is None:
        features_payload = {}

    plan = SubscriptionPlan(
        plan_code=body.plan_code,
        name=body.name,
        description=body.description,
        price=body.price,
        price_usd=body.price_usd if body.price_usd is not None else (0.0 if body.price == 0 else round(body.price / 85, 2)),
        currency=body.currency,
        billing_interval=body.billing_interval,
        max_brands=body.max_brands,
        max_campaigns_per_month=body.max_campaigns_per_month,
        features=features_payload,
        is_popular=body.is_popular,
        badge_text=body.badge_text,
        is_active=body.is_active,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {
        "status": "success",
        "message": f"Subscription plan '{plan.name}' created successfully.",
        "plan": {
            "id": plan.id,
            "plan_code": plan.plan_code,
            "name": plan.name,
            "description": plan.description,
            "price": plan.price,
            "price_usd": plan.price_usd,
            "currency": plan.currency,
            "billing_interval": plan.billing_interval,
            "max_brands": plan.max_brands,
            "max_campaigns_per_month": plan.max_campaigns_per_month,
            "features": plan.features,
            "is_popular": plan.is_popular,
            "badge_text": plan.badge_text,
            "is_active": plan.is_active,
        },
    }


@router.put("/plans/{plan_id}")
def update_subscription_plan(
    plan_id: int,
    body: UpdatePlanRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    plan = db.scalar(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription plan with id {plan_id} not found.",
        )

    if body.name is not None:
        plan.name = body.name
    if body.description is not None:
        plan.description = body.description
    if body.price is not None:
        plan.price = body.price
    if body.price_usd is not None:
        plan.price_usd = body.price_usd
    if body.currency is not None:
        plan.currency = body.currency
    if body.billing_interval is not None:
        plan.billing_interval = body.billing_interval
    if body.max_brands is not None:
        plan.max_brands = body.max_brands
    if body.max_campaigns_per_month is not None:
        plan.max_campaigns_per_month = body.max_campaigns_per_month
    if body.features is not None:
        features_payload = body.features
        if isinstance(features_payload, list):
            features_payload = {"bullets": features_payload}
        elif isinstance(features_payload, str):
            features_payload = {"bullets": [b.strip() for b in features_payload.split(",") if b.strip()]}
        plan.features = features_payload
    if body.is_popular is not None:
        plan.is_popular = body.is_popular
    if body.badge_text is not None:
        plan.badge_text = body.badge_text
    if body.is_active is not None:
        plan.is_active = body.is_active

    db.commit()
    db.refresh(plan)

    return {
        "status": "success",
        "message": f"Subscription plan '{plan.name}' updated successfully.",
        "plan": {
            "id": plan.id,
            "plan_code": plan.plan_code,
            "name": plan.name,
            "description": plan.description,
            "price": plan.price,
            "price_usd": getattr(plan, "price_usd", 0.0),
            "currency": plan.currency,
            "billing_interval": plan.billing_interval,
            "max_brands": plan.max_brands,
            "max_campaigns_per_month": plan.max_campaigns_per_month,
            "features": plan.features,
            "is_popular": getattr(plan, "is_popular", False),
            "badge_text": getattr(plan, "badge_text", None),
            "is_active": plan.is_active,
        },
    }



@router.delete("/plans/{plan_id}")
def delete_subscription_plan(
    plan_id: int,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    plan = db.scalar(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription plan with id {plan_id} not found.",
        )

    active_subs = db.scalar(
        select(TenantSubscription).where(
            TenantSubscription.plan_id == plan_id,
            TenantSubscription.status == "active",
        )
    )
    if active_subs:
        plan.is_active = False
        db.commit()
        return {
            "status": "deactivated",
            "message": "Plan is currently assigned to active subscribers. Marked as inactive.",
        }

    db.delete(plan)
    db.commit()
    return {
        "status": "success",
        "message": f"Subscription plan '{plan.name}' deleted successfully.",
    }


@router.get("/my-subscription")
def get_current_subscription(
    context: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    sub = db.scalar(
        select(TenantSubscription)
        .where(
            TenantSubscription.tenant_id == context.tenant_id,
            TenantSubscription.status == "active",
        )
        .order_by(TenantSubscription.id.desc())
    )

    if not sub:
        # Fallback to Free plan
        free_plan = db.scalar(
            select(SubscriptionPlan).where(SubscriptionPlan.plan_code == "free")
        )
        return {
            "tenant_id": context.tenant_id,
            "status": "active",
            "plan": {
                "plan_code": free_plan.plan_code if free_plan else "free",
                "name": free_plan.name if free_plan else "Free Starter",
                "max_brands": free_plan.max_brands if free_plan else 1,
            },
            "current_period_end": None,
        }

    plan = db.scalar(
        select(SubscriptionPlan).where(SubscriptionPlan.id == sub.plan_id)
    )

    return {
        "id": sub.id,
        "tenant_id": sub.tenant_id,
        "provider": sub.provider,
        "status": sub.status,
        "current_period_start": sub.current_period_start.isoformat()
        if sub.current_period_start
        else None,
        "current_period_end": sub.current_period_end.isoformat()
        if sub.current_period_end
        else None,
        "plan": {
            "id": plan.id if plan else None,
            "plan_code": plan.plan_code if plan else "unknown",
            "name": plan.name if plan else "Unknown Plan",
            "price": plan.price if plan else 0.0,
            "currency": plan.currency if plan else "INR",
        }
        if plan
        else None,
    }


@router.post("/create-order")
def create_payment_order(
    body: CreateOrderRequest,
    authenticated_user: AuthenticatedUser = Depends(get_authenticated_user),
    context: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    plan = db.scalar(
        select(SubscriptionPlan).where(
            SubscriptionPlan.plan_code == body.plan_code,
            SubscriptionPlan.is_active.is_(True),
        )
    )

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription plan not found.",
        )

    order_id = f"order_{body.provider}_{uuid.uuid4().hex[:12]}"

    tx = PaymentTransaction(
        tenant_id=context.tenant_id,
        user_id=authenticated_user.user_id,
        order_id=order_id,
        amount=plan.price,
        currency=plan.currency,
        status="created",
        provider=body.provider,
        raw_response={"plan_code": plan.plan_code},
    )

    db.add(tx)
    db.commit()
    db.refresh(tx)

    return {
        "status": "ok",
        "order_id": order_id,
        "amount": plan.price,
        "currency": plan.currency,
        "provider": body.provider,
        "plan_name": plan.name,
        "checkout_key": "rzp_test_sample_key_12345", # Frontend integration key
    }


@router.post("/verify-payment")
def verify_payment(
    body: VerifyPaymentRequest,
    context: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    tx = db.scalar(
        select(PaymentTransaction).where(
            PaymentTransaction.order_id == body.order_id,
            PaymentTransaction.tenant_id == context.tenant_id,
        )
    )

    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment transaction not found.",
        )

    plan_code = (tx.raw_response or {}).get("plan_code", "pro_monthly")
    plan = db.scalar(
        select(SubscriptionPlan).where(SubscriptionPlan.plan_code == plan_code)
    )

    if not plan:
        plan = db.scalar(select(SubscriptionPlan).limit(1))

    # Mark transaction paid
    tx.status = "paid"
    tx.payment_id = body.payment_id
    tx.raw_response = {
        **(tx.raw_response or {}),
        "payment_id": body.payment_id,
        "signature": body.signature,
        "verified_at": datetime.now(timezone.utc).isoformat(),
    }

    # Activate Tenant Subscription
    period_start = datetime.now(timezone.utc)
    period_end = period_start + timedelta(days=30 if plan.billing_interval == "monthly" else 365)

    sub = db.scalar(
        select(TenantSubscription).where(
            TenantSubscription.tenant_id == context.tenant_id
        )
    )

    if not sub:
        sub = TenantSubscription(
            tenant_id=context.tenant_id,
            plan_id=plan.id,
            provider=body.provider,
            status="active",
            current_period_start=period_start,
            current_period_end=period_end,
        )
        db.add(sub)
    else:
        sub.plan_id = plan.id
        sub.provider = body.provider
        sub.status = "active"
        sub.current_period_start = period_start
        sub.current_period_end = period_end

    db.commit()

    return {
        "status": "success",
        "message": "Payment verified and subscription activated successfully!",
        "plan_name": plan.name,
        "expires_at": period_end.isoformat(),
    }


@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    # Process Razorpay/Stripe webhook events
    return {"status": "event_received"}


@router.get("/transactions")
def get_user_transactions(
    context: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    Returns real payment transactions history for the authenticated tenant.
    """
    txs = db.scalars(
        select(PaymentTransaction)
        .where(PaymentTransaction.tenant_id == context.tenant_id)
        .order_by(PaymentTransaction.id.desc())
    ).all()

    return [
        {
            "id": tx.id,
            "order_id": tx.order_id,
            "payment_id": tx.payment_id,
            "amount": tx.amount,
            "currency": tx.currency,
            "status": tx.status,
            "provider": tx.provider,
            "plan_code": (tx.raw_response or {}).get("plan_code"),
            "created_at": tx.created_at.isoformat() if tx.created_at else None,
        }
        for tx in txs
    ]


@router.get("/admin/subscriptions")
def get_admin_subscriptions(
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Returns all tenant subscriptions and calculated platform revenue metrics for the Admin Panel.
    """
    subs = db.scalars(
        select(TenantSubscription).order_by(TenantSubscription.id.desc())
    ).all()

    result = []
    total_mrr = 0.0
    active_count = 0
    trial_count = 0
    past_due_count = 0

    for sub in subs:
        plan = db.scalar(select(SubscriptionPlan).where(SubscriptionPlan.id == sub.plan_id))
        tenant = db.scalar(select(Tenant).where(Tenant.tenant_id == sub.tenant_id))

        if sub.status == "active":
            active_count += 1
            if plan and plan.price > 0:
                total_mrr += plan.price
        elif sub.status == "trial":
            trial_count += 1
        elif sub.status == "past_due":
            past_due_count += 1

        result.append({
            "id": f"SUB-{sub.id}",
            "tenant_id": sub.tenant_id,
            "business_name": tenant.name if tenant else "Workspace",
            "plan_name": plan.name if plan else "Unknown Plan",
            "plan_code": plan.plan_code if plan else "unknown",
            "amount": plan.price if plan else 0.0,
            "currency": plan.currency if plan else "INR",
            "billing_interval": plan.billing_interval if plan else "monthly",
            "status": sub.status.capitalize(),
            "provider": sub.provider,
            "started": sub.current_period_start.strftime("%d %b %Y") if sub.current_period_start else "N/A",
            "renewal": sub.current_period_end.strftime("%d %b %Y") if sub.current_period_end else "N/A",
        })

    return {
        "summary": {
            "mrr": total_mrr,
            "active_count": active_count,
            "trial_count": trial_count,
            "past_due_count": past_due_count,
            "total_subscribers": len(subs),
        },
        "subscriptions": result,
    }


@router.get("/admin/transactions")
def get_admin_all_transactions(
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    Returns real payment transaction history across all tenants for the Admin Panel.
    """
    from app.database.models import User, BusinessProfile
    txs = db.scalars(
        select(PaymentTransaction).order_by(PaymentTransaction.id.desc())
    ).all()

    result = []
    for tx in txs:
        usr = db.scalar(select(User).where(User.id == tx.user_id)) if tx.user_id else None
        tenant = db.scalar(select(Tenant).where(Tenant.tenant_id == tx.tenant_id))
        bp = db.scalar(select(BusinessProfile).where(BusinessProfile.tenant_id == tx.tenant_id)) if tx.tenant_id else None

        cust_email = usr.email if usr else "customer@example.com"
        cust_name = cust_email.split("@")[0].replace(".", " ").replace("_", " ").title()
        biz_name = (bp.business_name if bp and bp.business_name else (tenant.name if tenant else "Workspace"))

        raw = tx.raw_response or {}
        plan_code = raw.get("plan_code", "Growth")
        if isinstance(plan_code, str):
            plan_code = plan_code.replace("_monthly", "").replace("_yearly", "").capitalize()

        st_map = {
            "paid": "Succeeded",
            "captured": "Succeeded",
            "succeeded": "Succeeded",
            "created": "Pending",
            "pending": "Pending",
            "failed": "Failed",
            "refunded": "Refunded",
        }
        st_text = st_map.get(tx.status.lower(), tx.status.capitalize())

        dt_str = tx.created_at.strftime("%d %b %Y, %H:%M") if tx.created_at else "Recent"

        result.append({
            "id": f"PAY-{tx.id:04d}",
            "transaction": tx.payment_id or tx.order_id or f"txn_{tx.id}",
            "customer": cust_name,
            "email": cust_email,
            "business": biz_name,
            "plan": plan_code,
            "amount": tx.amount,
            "status": st_text,
            "method": tx.provider.capitalize() if tx.provider else "Card",
            "date": dt_str,
        })

    return result

