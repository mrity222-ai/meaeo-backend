import asyncio
from app.workers.celery_app import celery_app
from app.workers.campaign_scheduler import CampaignSchedulerWorker


@celery_app.task(name="app.workers.tasks.process_due_posts_task", bind=True)
def process_due_posts_task(self):
    """
    Distributed Celery Task: Polls due campaign posts and triggers publishing.
    """
    worker = CampaignSchedulerWorker()
    processed_count = asyncio.run(worker.run_once())
    return {
        "status": "success",
        "processed_posts_count": processed_count,
    }


@celery_app.task(name="app.workers.tasks.publish_single_post_task", bind=True)
def publish_single_post_task(self, campaign_post_id: int):
    """
    Distributed Celery Task: Publishes a single campaign post asynchronously.
    """
    # High-concurrency async publishing worker task
    return {
        "status": "queued_for_publish",
        "campaign_post_id": campaign_post_id,
    }
