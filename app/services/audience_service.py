from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    BusinessAccount,
    TargetAudience,
)
from app.schemas.audience import (
    TargetAudienceCreate,
    TargetAudienceUpdate,
)
from app.security.tenant import TenantContext


class TargetAudienceService:

    def __init__(self, db: Session):
        self.db = db

    def list(
        self,
        context: TenantContext,
        business_account_id: int,
    ) -> list[TargetAudience]:

        return list(
            self.db.scalars(
                select(TargetAudience)
                .where(
                    TargetAudience.tenant_id
                    == context.tenant_id,
                    TargetAudience.business_account_id
                    == business_account_id,
                )
                .order_by(TargetAudience.id)
            ).all()
        )

    def get(
        self,
        context: TenantContext,
        business_account_id: int,
        audience_id: int,
    ) -> TargetAudience | None:

        return self.db.scalar(
            select(TargetAudience).where(
                TargetAudience.id == audience_id,
                TargetAudience.tenant_id
                == context.tenant_id,
                TargetAudience.business_account_id
                == business_account_id,
            )
        )

    def create(
        self,
        context: TenantContext,
        data: TargetAudienceCreate,
    ) -> TargetAudience:

        business_account_id = (
            data.business_account_id
        )

        business_account = self.db.scalar(
            select(BusinessAccount).where(
                BusinessAccount.id
                == business_account_id,
                BusinessAccount.tenant_id
                == context.tenant_id,
            )
        )

        if business_account is None:
            raise ValueError(
                "Business account not found."
            )

        if business_account.status != "active":
            raise ValueError(
                "Business account is not active."
            )

        values = data.model_dump(
            exclude={"business_account_id"}
        )

        audience = TargetAudience(
            tenant_id=context.tenant_id,
            business_account_id=business_account_id,
            **values,
        )

        self.db.add(audience)
        self.db.commit()
        self.db.refresh(audience)

        return audience

    def update(
        self,
        context: TenantContext,
        business_account_id: int,
        audience_id: int,
        data: TargetAudienceUpdate,
    ) -> TargetAudience:

        audience = self.get(
            context,
            business_account_id,
            audience_id,
        )

        if audience is None:
            raise ValueError(
                "Target audience not found."
            )

        values = data.model_dump(
            exclude_unset=True
        )

        for field, value in values.items():
            setattr(audience, field, value)

        self.db.commit()
        self.db.refresh(audience)

        return audience

    def delete(
        self,
        context: TenantContext,
        business_account_id: int,
        audience_id: int,
    ) -> None:

        audience = self.get(
            context,
            business_account_id,
            audience_id,
        )

        if audience is None:
            raise ValueError(
                "Target audience not found."
            )

        self.db.delete(audience)
        self.db.commit()