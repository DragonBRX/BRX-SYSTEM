"""
BRX SYSTEM - Projects API Routes
Open source AI project catalog management
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from src.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()

# In-memory project store (replace with database in production)
PROJECTS_DB: List[Dict[str, Any]] = []


class ProjectCreateRequest(BaseModel):
    name: str
    description: str
    url: str
    category: str
    stars: int = 0
    language: str = ""
    tags: List[str] = []
    metadata: Optional[Dict[str, Any]] = None


@router.get("/search")
async def search_projects(
    q: str = Query("", description="Search query"),
    category: str = Query("", description="Filter by category"),
    language: str = Query("", description="Filter by language"),
    min_stars: int = Query(0, description="Minimum stars"),
    limit: int = Query(20, description="Result limit"),
):
    """Search projects with filters."""
    results = PROJECTS_DB

    if q:
        q_lower = q.lower()
        results = [
            p for p in results
            if q_lower in p.get("name", "").lower()
            or q_lower in p.get("description", "").lower()
            or any(q_lower in t.lower() for t in p.get("tags", []))
        ]

    if category:
        results = [p for p in results if p.get("category", "") == category]

    if language:
        results = [p for p in results if p.get("language", "") == language]

    results = [p for p in results if p.get("stars", 0) >= min_stars]

    return {
        "projects": results[:limit],
        "total": len(results),
        "query": q,
    }


@router.get("/categories")
async def list_categories():
    """List all project categories."""
    categories = {}
    for p in PROJECTS_DB:
        cat = p.get("category", "Uncategorized")
        categories[cat] = categories.get(cat, 0) + 1
    return {"categories": categories}


@router.post("/add")
async def add_project(request: ProjectCreateRequest):
    """Add a new project to the catalog."""
    import uuid
    from datetime import datetime

    project = {
        "id": str(uuid.uuid4()),
        "name": request.name,
        "description": request.description,
        "url": request.url,
        "category": request.category,
        "stars": request.stars,
        "language": request.language,
        "tags": request.tags,
        "metadata": request.metadata or {},
        "created_at": datetime.utcnow().isoformat(),
    }

    PROJECTS_DB.append(project)
    logger.info("project_added", name=request.name, category=request.category)

    return {"status": "added", "project": project}


@router.get("/{project_id}")
async def get_project(project_id: str):
    """Get project by ID."""
    for p in PROJECTS_DB:
        if p["id"] == project_id:
            return p
    raise HTTPException(status_code=404, detail="Project not found")


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete a project."""
    global PROJECTS_DB
    original_len = len(PROJECTS_DB)
    PROJECTS_DB = [p for p in PROJECTS_DB if p["id"] != project_id]

    if len(PROJECTS_DB) == original_len:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"status": "deleted", "project_id": project_id}
