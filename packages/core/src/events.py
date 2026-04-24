"""
BRX SYSTEM - Application Lifecycle Events
"""

from src.core.logging import get_logger
from src.config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


async def startup_handler():
    """Handle application startup."""
    logger.info(
        "application_starting",
        app=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
    )

    try:
        logger.info("components_initialized")
    except Exception as e:
        logger.error("startup_error", error=str(e))


async def shutdown_handler():
    """Handle application shutdown."""
    logger.info("application_shutting_down")

    try:
        logger.info("cleanup_completed")
    except Exception as e:
        logger.error("shutdown_error", error=str(e))
