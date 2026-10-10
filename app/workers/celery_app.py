import os
from celery import Celery, Task
from app.services.admin_settings_service import settings_scope


class RuntimeSettingsTask(Task):
    abstract = True

    def __call__(self, *args, **kwargs):
        with settings_scope():
            return super().__call__(*args, **kwargs)


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "marketing_system_workers",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.workers.tasks"],
    task_cls=RuntimeSettingsTask,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    beat_schedule={
        "sync-platform-analytics-every-six-hours": {
            "task": "app.workers.tasks.sync_analytics_task",
            "schedule": 21600.0,
        },
        "process-due-campaign-posts-every-minute": {
            "task": "app.workers.tasks.process_due_posts_task",
            "schedule": 60.0,
        },
    },
)
