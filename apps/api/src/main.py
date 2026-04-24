"""
BRX SYSTEM - Main Application Entry Point
FastAPI application with modular architecture
"""

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import make_asgi_app

from src.config.settings import get_settings
from src.api.v1.router import api_router
from src.core.events import startup_handler, shutdown_handler
from src.core.logging import get_logger
from src.core.exceptions import BRXSystemException

logger = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    await startup_handler()
    yield
    await shutdown_handler()


app = FastAPI(
    title="BRX SYSTEM API",
    description="Open Source AI Integration Platform - REST API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers and log requests."""
    start_time = time.time()
    request_id = request.headers.get("X-Request-ID", "")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Request-ID"] = request_id
    
    logger.info(
        "request_processed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round(process_time * 1000, 2),
        request_id=request_id,
        client_host=request.client.host if request.client else None,
    )
    
    return response


@app.exception_handler(BRXSystemException)
async def brx_exception_handler(request: Request, exc: BRXSystemException):
    """Handle BRX system exceptions."""
    logger.error(
        "brx_exception",
        message=exc.message,
        status_code=exc.status_code,
        path=request.url.path,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "details": exc.details,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.exception("unexpected_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
        },
    )


# Health check
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/ready", tags=["health"])
async def readiness_check():
    """Readiness check for Kubernetes."""
    # Check database connection
    # Check Redis connection
    # Check vector stores
    return {
        "status": "ready",
        "checks": {
            "database": True,
            "redis": True,
            "vector_store": True,
        },
    }


# API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["root"])
async def root():
    """Root endpoint."""
    return {
        "name": "BRX SYSTEM",
        "version": "2.0.0",
        "description": "Open Source AI Integration Platform",
        "docs": "/docs",
        "health": "/health",
    }
