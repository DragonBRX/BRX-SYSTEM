"""
BRX SYSTEM - RAG API Routes
Document ingestion and question answering endpoints
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from src.core.rag.pipeline import RAGPipeline, RAGResponse
from src.core.vectorstore.base import create_vector_store
from src.core.llm.provider import LLMProvider
from src.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()

# Initialize RAG pipeline
vector_store = create_vector_store("memory")
rag_pipeline = RAGPipeline(
    vector_store=vector_store,
    llm_provider="ollama",
    llm_model="llama3.2",
)


class RAGQueryRequest(BaseModel):
    query: str
    top_k: int = 5
    filter_metadata: Optional[Dict[str, Any]] = None


class RAGIngestRequest(BaseModel):
    source: str
    content: str
    doc_type: str = "text"
    metadata: Optional[Dict[str, Any]] = None


@router.post("/query")
async def query_rag(request: RAGQueryRequest):
    """Query the RAG system."""
    try:
        result = await rag_pipeline.query(
            query=request.query,
            top_k=request.top_k,
            filter_metadata=request.filter_metadata,
        )
        return {
            "query": result.query,
            "answer": result.answer,
            "sources": [
                {
                    "content": r.chunk.content[:500],
                    "score": r.score,
                    "document_title": r.chunk.metadata.get("document_title", ""),
                }
                for r in result.sources
            ],
            "model": result.model,
            "tokens_used": result.tokens_used,
            "retrieval_time_ms": result.retrieval_time_ms,
            "generation_time_ms": result.generation_time_ms,
            "total_time_ms": result.total_time_ms,
        }
    except Exception as e:
        logger.error("rag_query_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest")
async def ingest_document(request: RAGIngestRequest):
    """Ingest a document into RAG."""
    try:
        document = await rag_pipeline.ingest_document(
            source=request.source,
            content=request.content.encode() if request.content else None,
            doc_type=request.doc_type,
            metadata=request.metadata,
        )
        return {
            "status": "ingested",
            "document_id": document.id,
            "title": document.title,
            "chunks": len(document.chunks),
        }
    except Exception as e:
        logger.error("rag_ingest_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("auto"),
    metadata: str = Form("{}"),
):
    """Upload and ingest a document file."""
    import json

    try:
        content = await file.read()
        meta = json.loads(metadata) if metadata else {}

        if doc_type == "auto":
            # Detect from filename
            ext = file.filename.split(".")[-1].lower()
            if ext == "pdf":
                doc_type = "pdf"
            elif ext in ["html", "htm"]:
                doc_type = "html"
            else:
                doc_type = "text"

        document = await rag_pipeline.ingest_document(
            source=file.filename,
            content=content,
            doc_type=doc_type,
            metadata=meta,
        )

        return {
            "status": "ingested",
            "document_id": document.id,
            "title": document.title,
            "chunks": len(document.chunks),
        }
    except Exception as e:
        logger.error("rag_upload_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents")
async def list_documents():
    """List all ingested documents."""
    return rag_pipeline.list_documents()


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document."""
    success = await rag_pipeline.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "deleted", "document_id": document_id}
