from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.schemas.frequency import FrequencyConfig


class FrequencyCalculator:
    """
    Calculates timezone-aware posting slots from a FrequencyConfig.

    The returned datetimes are timezone-aware and represent the
    configured local posting time in the configured timezone.
    """

    DAY_ORDER = {
        "monday": 0,
        "tuesday": 1,
        "wednesday": 2,
        "thursday": 3,
        "friday": 4,
        "saturday": 5,
        "sunday": 6,
    }

    def calculate(
        self,
        config: FrequencyConfig,
        start_date: date,
        number_of_posts: int,
    ) -> list[datetime]:

        if number_of_posts < 1:
            raise ValueError(
                "number_of_posts must be at least 1"
            )

        if config.frequency_type == "daily":
            return self._daily(
                config,
                start_date,
                number_of_posts,
            )

        if config.frequency_type == "interval":
            return self._interval(
                config,
                start_date,
                number_of_posts,
            )

        if config.frequency_type == "weekly":
            return self._weekly(
                config,
                start_date,
                number_of_posts,
            )

        if config.frequency_type == "monthly":
            return self._monthly(
                config,
                start_date,
                number_of_posts,
            )

        raise ValueError(
            f"Unsupported frequency type: "
            f"{config.frequency_type}"
        )

    def _daily(
        self,
        config: FrequencyConfig,
        start_date: date,
        number_of_posts: int,
    ) -> list[datetime]:

        return [
            self._at_posting_time(
                config,
                start_date + timedelta(days=index),
            )
            for index in range(number_of_posts)
        ]

    def _interval(
        self,
        config: FrequencyConfig,
        start_date: date,
        number_of_posts: int,
    ) -> list[datetime]:

        interval_days = config.interval_days

        if interval_days is None:
            raise ValueError(
                "interval_days is required"
            )

        return [
            self._at_posting_time(
                config,
                start_date
                + timedelta(
                    days=index * interval_days
                ),
            )
            for index in range(number_of_posts)
        ]

    def _weekly(
        self,
        config: FrequencyConfig,
        start_date: date,
        number_of_posts: int,
    ) -> list[datetime]:

        target_days = sorted(
            self.DAY_ORDER[day]
            for day in config.days_of_week
        )

        slots: list[datetime] = []
        current_date = start_date

        while len(slots) < number_of_posts:

            if current_date.weekday() in target_days:
                slots.append(
                    self._at_posting_time(
                        config,
                        current_date,
                    )
                )

            current_date += timedelta(days=1)

        return slots

    def _monthly(
        self,
        config: FrequencyConfig,
        start_date: date,
        number_of_posts: int,
    ) -> list[datetime]:

        posts_per_month = config.posts_per_month

        if posts_per_month is None:
            raise ValueError(
                "posts_per_month is required"
            )

        slots: list[datetime] = []
        current_month = start_date.replace(day=1)
        first_month = True

        while len(slots) < number_of_posts:

            month_start = current_month
            month_end = self._last_day(month_start)

            if first_month:
                available_start = start_date
                first_month = False

                month_dates = self._monthly_dates_from_start(
                    available_start,
                    month_end,
                    posts_per_month,
                )
            else:
                month_dates = self._monthly_dates(
                    month_start,
                    posts_per_month,
                )

            for candidate in month_dates:

                if len(slots) >= number_of_posts:
                    break

                slots.append(
                    self._at_posting_time(
                        config,
                        candidate,
                    )
                )

            # Move to the next month.
            if current_month.month == 12:
                current_month = date(
                    current_month.year + 1,
                    1,
                    1,
                )
            else:
                current_month = date(
                    current_month.year,
                    current_month.month + 1,
                    1,
                )

        return slots

    @staticmethod
    def _monthly_dates_from_start(
        start_date: date,
        month_end: date,
        posts_per_month: int,
    ) -> list[date]:

        available_days = (
            month_end - start_date
        ).days + 1

        posts_to_schedule = min(
            posts_per_month,
            available_days,
        )

        if posts_to_schedule == 1:
            return [month_end]

        if posts_to_schedule == 2:
            first_date = start_date
            last_date = month_end

            return [
                first_date,
                last_date,
            ]

        positions = [
            round(
                index
                * (available_days - 1)
                / (posts_to_schedule - 1)
            )
            for index in range(posts_to_schedule)
        ]

        unique_offsets = sorted(
            set(positions)
        )

        return [
            start_date + timedelta(days=offset)
            for offset in unique_offsets
        ]

    @staticmethod
    def _monthly_dates(
        month_start: date,
        posts_per_month: int,
    ) -> list[date]:

        if posts_per_month == 1:
            return [month_start]

        if posts_per_month == 2:
            return [
                month_start,
                FrequencyCalculator._last_day(
                    month_start
                ),
            ]

        last_day = FrequencyCalculator._last_day(
            month_start
        ).day

        positions = [
            round(
                1
                + index
                * (last_day - 1)
                / (posts_per_month - 1)
            )
            for index in range(posts_per_month)
        ]

        unique_days = sorted(
            set(positions)
        )

        return [
            month_start.replace(day=day)
            for day in unique_days
        ]

    @staticmethod
    def _last_day(
        month_start: date,
    ) -> date:

        if month_start.month == 12:
            next_month = date(
                month_start.year + 1,
                1,
                1,
            )
        else:
            next_month = date(
                month_start.year,
                month_start.month + 1,
                1,
            )

        return next_month - timedelta(days=1)

    @staticmethod
    def _at_posting_time(
        config: FrequencyConfig,
        posting_date: date,
    ) -> datetime:

        hour, minute = map(
            int,
            config.posting_time.split(":"),
        )

        timezone = ZoneInfo(
            config.timezone
        )

        return datetime.combine(
            posting_date,
            time(
                hour=hour,
                minute=minute,
            ),
            tzinfo=timezone,
        )