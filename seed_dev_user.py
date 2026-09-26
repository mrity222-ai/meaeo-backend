from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    Tenant,
    User,
    UserTenant,
)
from app.database.session import engine
from app.security.password import PasswordService


EMAIL = "sss1100990011@gmail.com"
PASSWORD = "Suryy117"
TENANT_ID = "tenant_001"
TENANT_NAME = "Development Tenant"


def main():

    with Session(engine) as db:

        # -----------------------------------------
        # Tenant
        # -----------------------------------------

        tenant = db.scalar(
            select(Tenant).where(
                Tenant.tenant_id == TENANT_ID
            )
        )

        if tenant is None:

            tenant = Tenant(
                tenant_id=TENANT_ID,
                name=TENANT_NAME,
            )

            db.add(tenant)
            db.flush()

        # -----------------------------------------
        # User
        # -----------------------------------------

        email = EMAIL.strip().lower()

        user = db.scalar(
            select(User).where(
                User.email == email
            )
        )

        if user is None:

            user = User(
                email=email,
                password_hash=PasswordService.hash(
                    PASSWORD
                ),
                is_active=True,
            )

            db.add(user)
            db.flush()

        else:

            user.password_hash = (
                PasswordService.hash(
                    PASSWORD
                )
            )

            user.is_active = True

            db.flush()

        # -----------------------------------------
        # User ↔ Tenant
        # -----------------------------------------

        membership = db.scalar(
            select(UserTenant).where(
                UserTenant.user_id == user.id,
                UserTenant.tenant_id == tenant.id,
            )
        )

        if membership is None:

            membership = UserTenant(
                user_id=user.id,
                tenant_id=tenant.id,
                is_active=True,
            )

            db.add(membership)

        else:

            membership.is_active = True

        db.commit()

        print()
        print(
            "Development user setup: PASSED"
        )
        print(
            f"Email: {email}"
        )
        print(
            f"Tenant: {TENANT_ID}"
        )


if __name__ == "__main__":
    main()