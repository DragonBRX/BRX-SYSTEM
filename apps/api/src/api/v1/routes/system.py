"""
BRX SYSTEM - System Routes
Configuration and system information
"""

from typing import Any, Dict
from fastapi import APIRouter

from src.config.settings import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/config")
async def get_config():
    """Get system configuration (safe values only)."""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "llm_provider": settings.DEFAULT_LLM_PROVIDER,
        "llm_model": settings.DEFAULT_LLM_MODEL,
        "embedding_model": settings.EMBEDDING_MODEL,
        "rag_chunk_size": settings.RAG_CHUNK_SIZE,
        "rag_top_k": settings.RAG_TOP_K,
    }


@router.get("/stats")
async def get_stats():
    """Get system statistics."""
    import psutil

    return {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory": {
            "total": psutil.virtual_memory().total,
            "available": psutil.virtual_memory().available,
            "percent": psutil.virtual_memory().percent,
        },
        "disk": {
            "total": psutil.disk_usage("/").total,
            "used": psutil.disk_usage("/").used,
            "free": psutil.disk_usage("/").free,
            "percent": psutil.disk_usage("/").percent,
        },
        "network": {
            "bytes_sent": psutil.net_io_counters().bytes_sent,
            "bytes_recv": psutil.net_io_counters().bytes_recv,
        },
    }
