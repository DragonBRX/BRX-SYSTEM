"""
BRX SYSTEM - Celery Background Worker
Task queue for async processing
"""

from celery import Celery
from src.config.settings import get_settings

settings = get_settings()

celery_app = Celery(
    "brx_system",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["apps.worker.src.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    worker_prefetch_multiplier=1,
)
