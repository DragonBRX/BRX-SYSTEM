"""
BRX SYSTEM - Celery Tasks
Background processing tasks
"""

from .worker import celery_app
from src.core.logging import get_logger

logger = get_logger("celery.tasks")


@celery_app.task(bind=True, max_retries=3)
def ingest_document_task(self, source: str, content: bytes, doc_type: str, metadata: dict):
    """Background document ingestion task."""
    try:
        from src.core.rag.pipeline import RAGPipeline
        from src.core.vectorstore.base import create_vector_store

        vector_store = create_vector_store("chroma")
        rag = RAGPipeline(vector_store)

        import asyncio
        document = asyncio.run(rag.ingest_document(source, content, doc_type, metadata))

        logger.info("document_ingested", document_id=document.id, task_id=self.request.id)
        return {"status": "success", "document_id": document.id, "chunks": len(document.chunks)}

    except Exception as exc:
        logger.error("ingest_failed", error=str(exc))
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=2)
def process_agent_execution(self, agent_name: str, query: str, context: dict):
    """Background agent execution task."""
    try:
        from src.core.agents.base import AgentOrchestrator
        from src.core.tools import create_default_tool_registry

        orchestrator = AgentOrchestrator()
        orchestrator.tool_registry = create_default_tool_registry()

        import asyncio
        result = asyncio.run(orchestrator.execute_single(agent_name, query, context))

        logger.info("agent_executed", execution_id=result.execution_id, task_id=self.request.id)
        return {
            "status": "success",
            "execution_id": result.execution_id,
            "output": result.final_output,
            "steps": result.total_steps,
        }

    except Exception as exc:
        logger.error("agent_execution_failed", error=str(exc))
        raise self.retry(exc=exc, countdown=30)


@celery_app.task
def scan_github_projects(category: str = "ai", limit: int = 50):
    """Background GitHub scanning task."""
    try:
        import subprocess
        result = subprocess.run(
            ["python", "scripts/github_scanner.py", "--category", category, "--limit", str(limit)],
            capture_output=True,
            text=True,
        )
        logger.info("github_scan_completed", category=category)
        return {"status": "success", "output": result.stdout}
    except Exception as e:
        logger.error("github_scan_failed", error=str(e))
        return {"status": "error", "error": str(e)}


@celery_app.task
def update_project_stats():
    """Periodic task to update project statistics."""
    try:
        import subprocess
        result = subprocess.run(
            ["python", "scripts/auto_updater.py"],
            capture_output=True,
            text=True,
        )
        logger.info("stats_updated")
        return {"status": "success"}
    except Exception as e:
        logger.error("stats_update_failed", error=str(e))
        return {"status": "error", "error": str(e)}
