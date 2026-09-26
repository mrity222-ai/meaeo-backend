from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    BusinessAccount,
    BusinessChannel,
)


class BusinessAccountRepository:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    # ------------------------------------------------------------------
    # Business Accounts
    # ------------------------------------------------------------------

    def get_by_id(
        self,
        tenant_id: str,
        business_account_id: int,
    ) -> BusinessAccount | None:

        return self.db.scalars(
            select(BusinessAccount).where(
                BusinessAccount.id
                == business_account_id,
                BusinessAccount.tenant_id
                == tenant_id,
            )
        ).first()

    def list_for_tenant(
        self,
        tenant_id: str,
    ) -> list[BusinessAccount]:

        return list(
            self.db.scalars(
                select(BusinessAccount)
                .where(
                    BusinessAccount.tenant_id
                    == tenant_id,
                )
                .order_by(
                    BusinessAccount.id
                )
            ).all()
        )

    def create(
        self,
        tenant_id: str,
        name: str,
    ) -> BusinessAccount:

        business_account = BusinessAccount(
            tenant_id=tenant_id,
            name=name,
            status="active",
        )

        self.db.add(
            business_account
        )

        self.db.commit()

        self.db.refresh(
            business_account
        )

        return business_account

    def update_status(
        self,
        tenant_id: str,
        business_account_id: int,
        status: str,
    ) -> BusinessAccount | None:

        business_account = self.get_by_id(
            tenant_id=tenant_id,
            business_account_id=business_account_id,
        )

        if business_account is None:
            return None

        business_account.status = status

        self.db.commit()

        self.db.refresh(
            business_account
        )

        return business_account

    # ------------------------------------------------------------------
    # Business Channels
    # ------------------------------------------------------------------

    def get_channel_by_id(
        self,
        tenant_id: str,
        channel_id: int,
    ) -> BusinessChannel | None:

        return self.db.scalars(
            select(BusinessChannel).where(
                BusinessChannel.id
                == channel_id,
                BusinessChannel.tenant_id
                == tenant_id,
            )
        ).first()

    def get_channel(
        self,
        tenant_id: str,
        business_account_id: int,
        platform: str,
    ) -> BusinessChannel | None:

        return self.db.scalars(
            select(BusinessChannel).where(
                BusinessChannel.tenant_id
                == tenant_id,
                BusinessChannel.business_account_id
                == business_account_id,
                BusinessChannel.platform
                == platform,
            )
        ).first()

    def get_channel_by_external_account(
        self,
        tenant_id: str,
        platform: str,
        external_account_id: str,
    ) -> BusinessChannel | None:

        return self.db.scalars(
            select(BusinessChannel).where(
                BusinessChannel.tenant_id
                == tenant_id,
                BusinessChannel.platform
                == platform,
                BusinessChannel.external_account_id
                == external_account_id,
            )
        ).first()

    def list_channels(
        self,
        tenant_id: str,
        business_account_id: int,
    ) -> list[BusinessChannel]:

        return list(
            self.db.scalars(
                select(BusinessChannel)
                .where(
                    BusinessChannel.tenant_id
                    == tenant_id,
                    BusinessChannel.business_account_id
                    == business_account_id,
                )
                .order_by(
                    BusinessChannel.id
                )
            ).all()
        )

    def create_channel(
        self,
        tenant_id: str,
        business_account_id: int,
        platform: str,
        external_account_id: str,
        account_name: str,
        platform_metadata: dict | None = None,
    ) -> BusinessChannel:

        business_account = self.get_by_id(
            tenant_id=tenant_id,
            business_account_id=business_account_id,
        )

        if business_account is None:
            raise ValueError(
                "Business Account not found."
            )

        if business_account.status != "active":
            raise ValueError(
                "Business Account is not active."
            )

        existing_channel = self.get_channel(
            tenant_id=tenant_id,
            business_account_id=business_account_id,
            platform=platform,
        )

        if existing_channel is not None:
            raise ValueError(
                f"A {platform} channel is already connected "
                "to this Business Account."
            )

        existing_external_account = (
            self.get_channel_by_external_account(
                tenant_id=tenant_id,
                platform=platform,
                external_account_id=external_account_id,
            )
        )

        if existing_external_account is not None:
            raise ValueError(
                f"The {platform} account is already connected "
                "to another Business Account."
            )

        channel = BusinessChannel(
            tenant_id=tenant_id,
            business_account_id=business_account_id,
            platform=platform,
            external_account_id=external_account_id,
            account_name=account_name,
            status="active",
            is_enabled=True,
            platform_metadata=platform_metadata,
        )

        self.db.add(channel)

        self.db.commit()

        self.db.refresh(
            channel
        )

        return channel

    def update_channel_status(
        self,
        tenant_id: str,
        channel_id: int,
        status: str,
    ) -> BusinessChannel | None:

        channel = self.get_channel_by_id(
            tenant_id=tenant_id,
            channel_id=channel_id,
        )

        if channel is None:
            return None

        channel.status = status

        self.db.commit()

        self.db.refresh(
            channel
        )

        return channel

    def set_channel_enabled(
        self,
        tenant_id: str,
        channel_id: int,
        enabled: bool,
    ) -> BusinessChannel | None:

        channel = self.get_channel_by_id(
            tenant_id=tenant_id,
            channel_id=channel_id,
        )

        if channel is None:
            return None

        channel.is_enabled = enabled

        self.db.commit()

        self.db.refresh(
            channel
        )

        return channel