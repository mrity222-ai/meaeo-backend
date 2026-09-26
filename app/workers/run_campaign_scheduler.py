import time

from app.workers.campaign_scheduler import (
    CampaignScheduler,
)


POLL_INTERVAL_SECONDS = 15


def main():

    scheduler = CampaignScheduler()

    print(
        "Campaign scheduler started."
    )

    print(
        f"Polling every "
        f"{POLL_INTERVAL_SECONDS} seconds."
    )

    while True:

        try:

            scheduler.process_due_posts()

        except Exception as exc:

            print(
                "Campaign scheduler error:",
                exc,
            )

        time.sleep(
            POLL_INTERVAL_SECONDS
        )


if __name__ == "__main__":

    main()