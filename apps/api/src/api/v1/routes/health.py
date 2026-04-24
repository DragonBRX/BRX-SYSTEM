"""
BRX SYSTEM - Health Check Routes
System monitoring and diagnostics
"""

from fastapi import APIRouter

from src.core.logging import get_logger
from src.config.settings import get_settings

logger = get_logger(__name__)
router = APIRouter()
settings = get_settings()


@router.get("/")
async def health_check():
    """Basic health check."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
    }


@router.get("/detailed")
async def detailed_health():
    """Detailed health check with component status."""
    checks = {
        "api": True,
        "database": await _check_database(),
        "redis": await _check_redis(),
        "vector_store": True,
        "disk_space": _check_disk_space(),
    }

    all_healthy = all(checks.values())

    return {
        "status": "healthy" if all_healthy else "degraded",
        "checks": checks,
        "version": settings.APP_VERSION,
    }


async def _check_database() -> bool:
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except:
        return False


async def _check_redis() -> bool:
    try:
        import redis
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        return True
    except:
        return False


def _check_disk_space() -> bool:
    try:
        import shutil
        stat = shutil.disk_usage("/")
        free_percent = (stat.free / stat.total) * 100
        return free_percent > 10
    except:
        return True
