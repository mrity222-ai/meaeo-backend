from datetime import datetime, timezone
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    BusinessAccount,
    BusinessProfile,
    SupportMessage,
    SupportTicket,
    Tenant,
    User,
    UserTenant,
)
from app.database.session import get_db
from app.api.dependencies import get_current_admin
from app.security.authentication import AuthenticationService, AuthenticatedUser

router = APIRouter(
    prefix="/support",
    tags=["support"],
)


class CreateTicketRequest(BaseModel):
    subject: str
    message: str
    category: str = "general"
    priority: str = "medium"


class AddMessageRequest(BaseModel):
    message: str


class AdminUpdateTicketRequest(BaseModel):
    status: str | None = None
    priority: str | None = None
    admin_reply: str | None = None


def resolve_support_user_and_tenant(
    request: Request,
    db: Session,
) -> tuple[int, str]:
    """
    Resolves authenticated (user_id, tenant_id) requiring valid JWT token.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.strip().lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.strip().split(" ", 1)[1]
    try:
        user_id = AuthenticationService.decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.scalar(select(User).where(User.id == user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    x_tenant_id = request.headers.get("X-Tenant-Id") or request.headers.get("x-tenant-id")
    if x_tenant_id:
        membership = db.scalar(
            select(UserTenant)
            .join(Tenant, Tenant.id == UserTenant.tenant_id)
            .where(
                UserTenant.user_id == user.id,
                UserTenant.is_active == True,
                Tenant.tenant_id == x_tenant_id.strip(),
            )
        )
        if membership and membership.tenant:
            return (user.id, membership.tenant.tenant_id)

    membership = db.scalar(
        select(UserTenant)
        .where(UserTenant.user_id == user.id, UserTenant.is_active == True)
        .order_by(UserTenant.id.asc())
    )
    if membership and membership.tenant:
        return (user.id, membership.tenant.tenant_id)

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="User does not have an active workspace tenant.",
    )


@router.post("/tickets")
def create_support_ticket(
    body: CreateTicketRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    user_id, tenant_id = resolve_support_user_and_tenant(request, db)

    ticket_num = f"TICK-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"

    ticket = SupportTicket(
        tenant_id=tenant_id,
        user_id=user_id,
        ticket_number=ticket_num,
        subject=body.subject.strip(),
        category=body.category.strip(),
        priority=body.priority.strip().lower(),
        status="open",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    first_msg = SupportMessage(
        ticket_id=ticket.id,
        sender_user_id=user_id,
        sender_type="user",
        message=body.message.strip(),
    )
    db.add(first_msg)
    db.commit()

    return {
        "status": "success",
        "ticket_id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "subject": ticket.subject,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "created_at": ticket.created_at.isoformat(),
    }


@router.get("/tickets")
def list_user_tickets(
    request: Request,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    user_id, tenant_id = resolve_support_user_and_tenant(request, db)

    tickets = db.scalars(
        select(SupportTicket)
        .where(SupportTicket.tenant_id == tenant_id)
        .order_by(SupportTicket.id.desc())
    ).all()

    result = []
    for t in tickets:
        last_msg = db.scalar(
            select(SupportMessage)
            .where(SupportMessage.ticket_id == t.id)
            .order_by(SupportMessage.id.desc())
        )
        result.append(
            {
                "id": t.id,
                "ticket_number": t.ticket_number,
                "subject": t.subject,
                "category": t.category,
                "priority": t.priority,
                "status": t.status,
                "last_message": last_msg.message if last_msg else None,
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat() if t.updated_at else None,
            }
        )
    return result


@router.get("/tickets/{ticket_id}")
def get_ticket_details(
    ticket_id: str,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    user_id, tenant_id = resolve_support_user_and_tenant(request, db)

    query = select(SupportTicket)
    if ticket_id.isdigit():
        query = query.where(SupportTicket.id == int(ticket_id))
    else:
        query = query.where(SupportTicket.ticket_number == ticket_id.strip())

    ticket = db.scalar(query)

    if not ticket or (ticket.tenant_id != tenant_id and ticket.user_id != user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Support ticket '{ticket_id}' not found.",
        )

    messages = db.scalars(
        select(SupportMessage)
        .where(SupportMessage.ticket_id == ticket.id)
        .order_by(SupportMessage.id.asc())
    ).all()

    msgs_list = []
    for m in messages:
        sender_email = None
        if m.sender_user_id:
            u = db.scalar(select(User).where(User.id == m.sender_user_id))
            if u:
                sender_email = u.email

        msgs_list.append(
            {
                "id": m.id,
                "sender_type": m.sender_type,
                "sender_email": sender_email or ("Support Team" if m.sender_type == "admin" else "Customer"),
                "message": m.message,
                "created_at": m.created_at.isoformat(),
            }
        )

    u = db.scalar(select(User).where(User.id == ticket.user_id))
    bp = db.scalar(select(BusinessProfile).where(BusinessProfile.tenant_id == ticket.tenant_id))
    ba = db.scalar(select(BusinessAccount).where(BusinessAccount.tenant_id == ticket.tenant_id))
    t = db.scalar(select(Tenant).where(Tenant.tenant_id == ticket.tenant_id))
    biz_name = bp.business_name if (bp and bp.business_name) else (ba.name if ba else (t.name if t else "Workspace"))

    return {
        "id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "subject": ticket.subject,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "customer": u.email.split("@")[0].title() if u else "Customer",
        "email": u.email if u else "customer@workspace.local",
        "business": biz_name,
        "created_at": ticket.created_at.isoformat(),
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
        "messages": msgs_list,
    }


@router.post("/tickets/{ticket_id}/messages")
def reply_to_ticket(
    ticket_id: str,
    body: AddMessageRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    user_id, tenant_id = resolve_support_user_and_tenant(request, db)

    query = select(SupportTicket)
    if ticket_id.isdigit():
        query = query.where(SupportTicket.id == int(ticket_id))
    else:
        query = query.where(SupportTicket.ticket_number == ticket_id.strip())

    ticket = db.scalar(query)

    if not ticket or (ticket.tenant_id != tenant_id and ticket.user_id != user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Support ticket '{ticket_id}' not found.",
        )

    msg = SupportMessage(
        ticket_id=ticket.id,
        sender_user_id=user_id,
        sender_type="user",
        message=body.message.strip(),
    )
    ticket.updated_at = datetime.now(timezone.utc)
    # If ticket was resolved/closed, reopen on user reply
    if ticket.status in ("resolved", "closed"):
        ticket.status = "open"

    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "status": "success",
        "message_id": msg.id,
        "ticket_id": ticket.id,
        "ticket_status": ticket.status,
        "created_at": msg.created_at.isoformat(),
    }


# ---------------------------------------------------------
# Admin Support Endpoints
# ---------------------------------------------------------

@router.get("/admin/all-tickets")
def admin_list_all_tickets(
    status_filter: str | None = None,
    admin: AuthenticatedUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    query = select(SupportTicket).order_by(SupportTicket.id.desc())
    if status_filter and status_filter.lower() != "all":
        query = query.where(SupportTicket.status == status_filter.lower())

    tickets = db.scalars(query).all()
    result = []
    for t in tickets:
        u = db.scalar(select(User).where(User.id == t.user_id))
        bp = db.scalar(select(BusinessProfile).where(BusinessProfile.tenant_id == t.tenant_id))
        ba = db.scalar(select(BusinessAccount).where(BusinessAccount.tenant_id == t.tenant_id))
        tenant_obj = db.scalar(select(Tenant).where(Tenant.tenant_id == t.tenant_id))
        biz_name = (
            bp.business_name
            if (bp and bp.business_name)
            else (ba.name if ba else (tenant_obj.name if tenant_obj else "Workspace"))
        )

        last_msg = db.scalar(
            select(SupportMessage)
            .where(SupportMessage.ticket_id == t.id)
            .order_by(SupportMessage.id.desc())
        )
        msg_count = len(
            db.scalars(
                select(SupportMessage).where(SupportMessage.ticket_id == t.id)
            ).all()
        )
        result.append(
            {
                "id": t.id,
                "tenant_id": t.tenant_id,
                "user_email": u.email if u else "customer@workspace.local",
                "customer": (u.email.split("@")[0].title() if u and u.email else "Customer"),
                "business": biz_name,
                "ticket_number": t.ticket_number,
                "subject": t.subject,
                "category": t.category,
                "priority": t.priority,
                "status": t.status,
                "messages_count": msg_count,
                "last_message": last_msg.message if last_msg else None,
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat() if t.updated_at else None,
            }
        )
    return result


@router.patch("/admin/tickets/{ticket_id}")
def admin_update_ticket(
    ticket_id: str,
    body: AdminUpdateTicketRequest,
    request: Request,
    admin: AuthenticatedUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    query = select(SupportTicket)
    if ticket_id.isdigit():
        query = query.where(SupportTicket.id == int(ticket_id))
    else:
        query = query.where(SupportTicket.ticket_number == ticket_id.strip())

    ticket = db.scalar(query)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' not found.",
        )

    if body.status:
        ticket.status = body.status.strip().lower()
    if body.priority:
        ticket.priority = body.priority.strip().lower()

    ticket.updated_at = datetime.now(timezone.utc)

    admin_user_id, _ = resolve_support_user_and_tenant(request, db)

    if body.admin_reply and body.admin_reply.strip():
        reply_msg = SupportMessage(
            ticket_id=ticket.id,
            sender_user_id=admin_user_id,
            sender_type="admin",
            message=body.admin_reply.strip(),
        )
        db.add(reply_msg)

    db.commit()
    db.refresh(ticket)

    return {
        "status": "success",
        "ticket_id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "new_status": ticket.status,
        "new_priority": ticket.priority,
    }
