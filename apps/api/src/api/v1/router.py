"""
BRX SYSTEM - Core API Router
Main API routing configuration
"""

from fastapi import APIRouter

from src.api.v1.routes import agents, projects, rag, models, nlp, vision, audio, health, system

api_router = APIRouter()

# Include all sub-routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(system.router, prefix="/system", tags=["system"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(nlp.router, prefix="/nlp", tags=["nlp"])
api_router.include_router(vision.router, prefix="/vision", tags=["vision"])
api_router.include_router(audio.router, prefix="/audio", tags=["audio"])
