from datetime import date


class ResearchPolicy:
    """
    Controls when research providers should run
    and how many new SEO keywords may be queried.
    """

    DATAFORSEO_WEEKLY_LIMITS = {
        1: 20,
        2: 15,
        3: 12,
        4: 10,
        5: 7,
        6: 5,
        7: 3,
    }

    @staticmethod
    def should_run_tavily(
        current_date: date | None = None,
    ) -> bool:

        if current_date is None:
            current_date = date.today()

        # Monday, Wednesday, Friday, Sunday
        return current_date.weekday() % 2 == 0

    @staticmethod
    def dataforseo_limit(
        current_date: date | None = None,
    ) -> int:

        if current_date is None:
            current_date = date.today()

        return ResearchPolicy.DATAFORSEO_WEEKLY_LIMITS[
            current_date.isoweekday()
        ]

    @staticmethod
    def should_refresh_firecrawl(
        cached_at,
        current_date=None,
        max_age_days: int = 7,
    ) -> bool:

        if cached_at is None:
            return True

        if current_date is None:
            current_date = date.today()

        age = (
            current_date - cached_at.date()
        ).days

        return age >= max_age_days