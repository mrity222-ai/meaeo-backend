from datetime import date, datetime, timezone
from pathlib import Path

from app.analytics.schemas import CampaignAnalytics
from app.storage.base import BaseStorage
from app.storage.factory import StorageFactory


class AnalyticsRepository:
    ROOT = Path("data/analytics")

    def __init__(
        self,
        storage: BaseStorage | None = None,
    ):
        self.storage = (
            storage
            if storage is not None
            else StorageFactory.create()
        )

        self.ROOT.mkdir(
            parents=True,
            exist_ok=True,
        )

    # ------------------------------------------------------------------
    # Key helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _tenant_key(
        tenant_id: str,
    ) -> str:
        tenant_id = tenant_id.strip().lower()

        if not tenant_id:
            raise ValueError(
                "tenant_id cannot be empty."
            )

        return tenant_id

    @staticmethod
    def _campaign_key(
        campaign_name: str,
    ) -> str:
        campaign_name = campaign_name.strip()

        if not campaign_name:
            raise ValueError(
                "campaign_name cannot be empty."
            )

        return (
            campaign_name
            .replace(" ", "_")
            .lower()
        )

    def _campaign_dir(
        self,
        tenant_id: str,
        campaign_name: str,
    ) -> Path:
        return (
            self.ROOT
            / self._tenant_key(tenant_id)
            / self._campaign_key(campaign_name)
        )

    def _path(
        self,
        tenant_id: str,
        campaign_name: str,
        snapshot_date: date,
    ) -> Path:
        return (
            self._campaign_dir(
                tenant_id,
                campaign_name,
            )
            / f"{snapshot_date.isoformat()}.json"
        )

    # ------------------------------------------------------------------
    # Save
    # ------------------------------------------------------------------

    def save(
        self,
        tenant_id: str | CampaignAnalytics,
        analytics: CampaignAnalytics | date,
        snapshot_date: date | None = None,
    ) -> Path:
        """
        Save an analytics snapshot.

        Supported forms:

        Tenant-aware:
            save(tenant_id, analytics)
            save(tenant_id, analytics, snapshot_date)

        Legacy:
            save(analytics, snapshot_date)

        Legacy records are stored under the "default" tenant.
        """

        # Legacy:
        #
        #     save(analytics, snapshot_date)
        #
        if isinstance(
            tenant_id,
            CampaignAnalytics,
        ):
            legacy_analytics = tenant_id

            if isinstance(
                analytics,
                date,
            ):
                legacy_snapshot_date = analytics
            else:
                legacy_snapshot_date = snapshot_date

            tenant_key = "default"
            analytics = legacy_analytics
            snapshot_date = legacy_snapshot_date

        # Tenant-aware:
        #
        #     save(tenant_id, analytics, snapshot_date)
        #
        else:
            tenant_key = tenant_id

        if not tenant_key:
            raise ValueError(
                "tenant_id is required."
            )

        if not isinstance(
            analytics,
            CampaignAnalytics,
        ):
            raise ValueError(
                "analytics is required."
            )

        if snapshot_date is None:
            snapshot_date = (
                datetime.now(
                    timezone.utc
                ).date()
            )

        if not isinstance(
            snapshot_date,
            date,
        ):
            raise ValueError(
                "snapshot_date must be a date."
            )

        path = self._path(
            tenant_key,
            analytics.campaign_name,
            snapshot_date,
        )

        self.storage.save(
            path,
            analytics.model_dump(
                mode="json"
            ),
        )

        return path

    # ------------------------------------------------------------------
    # Load
    # ------------------------------------------------------------------

    def load(
        self,
        tenant_id: str,
        campaign_name: str | date,
        snapshot_date: date | None = None,
    ) -> CampaignAnalytics:
        """
        Load an analytics snapshot.

        Supported forms:

        Tenant-aware:
            load(tenant_id, campaign_name, snapshot_date)

        Legacy:
            load(campaign_name, snapshot_date)

        Legacy records are loaded from the "default" tenant.
        """

        # Legacy:
        #
        #     load(campaign_name, snapshot_date)
        #
        if isinstance(
            campaign_name,
            date,
        ):
            legacy_campaign_name = tenant_id
            legacy_snapshot_date = campaign_name

            tenant_key = "default"
            campaign_name = legacy_campaign_name
            snapshot_date = legacy_snapshot_date

        # Tenant-aware:
        #
        #     load(tenant_id, campaign_name, snapshot_date)
        #
        else:
            tenant_key = tenant_id

        if not tenant_key:
            raise ValueError(
                "tenant_id is required."
            )

        if not campaign_name:
            raise ValueError(
                "campaign_name is required."
            )

        if snapshot_date is None:
            raise ValueError(
                "snapshot_date is required."
            )

        if not isinstance(
            snapshot_date,
            date,
        ):
            raise ValueError(
                "snapshot_date must be a date."
            )

        path = self._path(
            tenant_key,
            campaign_name,
            snapshot_date,
        )

        data = self.storage.load(
            path
        )

        return CampaignAnalytics.model_validate(
            data
        )

    # ------------------------------------------------------------------
    # Exists
    # ------------------------------------------------------------------

    def exists(
        self,
        tenant_id: str,
        campaign_name: str | date,
        snapshot_date: date | None = None,
    ) -> bool:
        """
        Check whether an analytics snapshot exists.

        Supported forms:

        Tenant-aware:
            exists(tenant_id, campaign_name, snapshot_date)

        Legacy:
            exists(campaign_name, snapshot_date)

        Legacy records are checked under the "default" tenant.
        """

        # Legacy:
        #
        #     exists(campaign_name, snapshot_date)
        #
        if isinstance(
            campaign_name,
            date,
        ):
            legacy_campaign_name = tenant_id
            legacy_snapshot_date = campaign_name

            tenant_key = "default"
            campaign_name = legacy_campaign_name
            snapshot_date = legacy_snapshot_date

        # Tenant-aware.
        else:
            tenant_key = tenant_id

        if not tenant_key:
            raise ValueError(
                "tenant_id is required."
            )

        if not campaign_name:
            raise ValueError(
                "campaign_name is required."
            )

        if snapshot_date is None:
            raise ValueError(
                "snapshot_date is required."
            )

        if not isinstance(
            snapshot_date,
            date,
        ):
            raise ValueError(
                "snapshot_date must be a date."
            )

        path = self._path(
            tenant_key,
            campaign_name,
            snapshot_date,
        )

        return self.storage.exists(
            path
        )

    # ------------------------------------------------------------------
    # List snapshots
    # ------------------------------------------------------------------

    def list_snapshots(
        self,
        tenant_id: str,
        campaign_name: str | None = None,
    ) -> list[date]:
        """
        List analytics snapshot dates.

        Supported forms:

        Tenant-aware:
            list_snapshots(tenant_id, campaign_name)

        Legacy:
            list_snapshots(campaign_name)

        Legacy records are read from the "default" tenant.
        """

        # Legacy:
        #
        #     list_snapshots(campaign_name)
        #
        if campaign_name is None:
            campaign_name = tenant_id
            tenant_key = "default"

        # Tenant-aware:
        #
        #     list_snapshots(tenant_id, campaign_name)
        #
        else:
            tenant_key = tenant_id

        if not tenant_key:
            raise ValueError(
                "tenant_id is required."
            )

        if not campaign_name:
            raise ValueError(
                "campaign_name is required."
            )

        campaign_dir = self._campaign_dir(
            tenant_key,
            campaign_name,
        )

        paths = self.storage.list(
            campaign_dir
        )

        snapshots: list[date] = []

        for path in paths:
            if path.suffix.lower() != ".json":
                continue

            try:
                snapshot_date = date.fromisoformat(
                    path.stem
                )
            except ValueError:
                continue

            snapshots.append(
                snapshot_date
            )

        snapshots.sort()

        return snapshots

    # ------------------------------------------------------------------
    # Latest
    # ------------------------------------------------------------------

    def latest(
        self,
        tenant_id: str,
        campaign_name: str | None = None,
    ) -> CampaignAnalytics | None:
        """
        Return the latest analytics snapshot.

        Supported forms:

        Tenant-aware:
            latest(tenant_id, campaign_name)

        Legacy:
            latest(campaign_name)

        Legacy records are read from the "default" tenant.
        """

        # Legacy:
        #
        #     latest(campaign_name)
        #
        if campaign_name is None:
            campaign_name = tenant_id
            tenant_key = "default"

        # Tenant-aware:
        else:
            tenant_key = tenant_id

        if not tenant_key:
            raise ValueError(
                "tenant_id is required."
            )

        if not campaign_name:
            raise ValueError(
                "campaign_name is required."
            )

        snapshots = self.list_snapshots(
            tenant_key,
            campaign_name,
        )

        if not snapshots:
            return None

        return self.load(
            tenant_key,
            campaign_name,
            snapshots[-1],
        )

    # ------------------------------------------------------------------
    # Load range
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # Load range
    # ------------------------------------------------------------------

    def load_range(
        self,
        tenant_id: str,
        campaign_name: str | date,
        start_date: date,
        end_date: date | None = None,
    ) -> list[CampaignAnalytics]:
        """
        Load analytics snapshots within an inclusive date range.

        Supported forms:

        Tenant-aware:
            load_range(
                tenant_id,
                campaign_name,
                start_date,
                end_date,
            )

        Legacy:
            load_range(
                campaign_name,
                start_date,
                end_date,
            )

        Legacy records are read from the "default" tenant.

        Results are returned chronologically.
        """

        # --------------------------------------------------------------
        # Legacy form:
        #
        #     load_range(
        #         campaign_name,
        #         start_date,
        #         end_date,
        #     )
        #
        # Python binds this as:
        #
        #     tenant_id   = campaign_name
        #     campaign_name = start_date
        #     start_date  = end_date
        #     end_date    = None
        # --------------------------------------------------------------
        if isinstance(
            campaign_name,
            date,
        ):
            legacy_campaign_name = tenant_id
            legacy_start_date = campaign_name
            legacy_end_date = start_date

            tenant_key = "default"
            campaign_name = legacy_campaign_name
            start_date = legacy_start_date
            end_date = legacy_end_date

        # --------------------------------------------------------------
        # Tenant-aware form.
        # --------------------------------------------------------------
        else:
            tenant_key = tenant_id

        if not tenant_key:
            raise ValueError(
                "tenant_id is required."
            )

        if not campaign_name:
            raise ValueError(
                "campaign_name is required."
            )

        if end_date is None:
            raise ValueError(
                "end_date is required."
            )

        if not isinstance(
            start_date,
            date,
        ):
            raise ValueError(
                "start_date must be a date."
            )

        if not isinstance(
            end_date,
            date,
        ):
            raise ValueError(
                "end_date must be a date."
            )

        if start_date > end_date:
            raise ValueError(
                "start_date cannot be after end_date."
            )

        snapshots = self.list_snapshots(
            tenant_key,
            campaign_name,
        )

        results: list[CampaignAnalytics] = []

        for snapshot_date in snapshots:
            if (
                start_date
                <= snapshot_date
                <= end_date
            ):
                results.append(
                    self.load(
                        tenant_key,
                        campaign_name,
                        snapshot_date,
                    )
                )

        return results