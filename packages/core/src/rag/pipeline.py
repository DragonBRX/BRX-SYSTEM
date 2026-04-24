"""
BRX SYSTEM - RAG (Retrieval-Augmented Generation) Pipeline
Complete RAG system with document ingestion, chunking, embedding, and retrieval
"""

import hashlib
import json
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncIterator, Dict, List, Optional, Tuple
from uuid import uuid4

import numpy as np
from src.core.logging import get_logger
from src.core.llm import LLMProvider, LLMMessage
from src.core.vectorstore import VectorStore, VectorDocument
from src.config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


@dataclass
class Chunk:
    """Document chunk with metadata."""
    id: str
    content: str
    document_id: str
    chunk_index: int
    total_chunks: int
    metadata: Dict[str, Any] = field(default_factory=dict)
    embedding: Optional[List[float]] = None


@dataclass
class IngestedDocument:
    """Document after ingestion."""
    id: str
    source: str
    title: str
    content: str
    doc_type: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    chunks: List[Chunk] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def total_chunks(self) -> int:
        return len(self.chunks)


@dataclass
class RetrievalResult:
    """Result from retrieval query."""
    chunk: Chunk
    score: float
    rank: int


@dataclass
class RAGResponse:
    """Complete RAG response."""
    query: str
    answer: str
    sources: List[RetrievalResult]
    context_used: str
    model: str
    tokens_used: int
    retrieval_time_ms: float
    generation_time_ms: float
    total_time_ms: float


class DocumentParser(ABC):
    """Base class for document parsers."""
    
    @abstractmethod
    async def parse(self, source: str, content: bytes = None) -> IngestedDocument:
        """Parse a document from source or raw content."""
        pass
    
    @property
    @abstractmethod
    def supported_types(self) -> List[str]:
        """List of supported MIME types or extensions."""
        pass


class TextParser(DocumentParser):
    """Parse plain text files."""
    
    @property
    def supported_types(self) -> List[str]:
        return ["text/plain", ".txt", ".md", ".csv", ".json"]
    
    async def parse(self, source: str, content: bytes = None) -> IngestedDocument:
        if content:
            text = content.decode("utf-8", errors="replace")
        else:
            text = Path(source).read_text(encoding="utf-8", errors="replace")
        
        return IngestedDocument(
            id=str(uuid4()),
            source=source,
            title=Path(source).name,
            content=text,
            doc_type="text",
        )


class PDFParser(DocumentParser):
    """Parse PDF files."""
    
    @property
    def supported_types(self) -> List[str]:
        return ["application/pdf", ".pdf"]
    
    async def parse(self, source: str, content: bytes = None) -> IngestedDocument:
        try:
            import pdfplumber
            
            if content:
                from io import BytesIO
                pdf_file = BytesIO(content)
            else:
                pdf_file = source
            
            text_parts = []
            metadata = {}
            
            with pdfplumber.open(pdf_file) as pdf:
                metadata = {
                    "pages": len(pdf.pages),
                    "title": pdf.metadata.get("Title", ""),
                    "author": pdf.metadata.get("Author", ""),
                }
                
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(f"--- Page {i + 1} ---\n{page_text}")
            
            full_text = "\n\n".join(text_parts)
            
            return IngestedDocument(
                id=str(uuid4()),
                source=source,
                title=metadata.get("title") or Path(source).name,
                content=full_text,
                doc_type="pdf",
                metadata=metadata,
            )
        except ImportError:
            logger.error("pdfplumber_not_installed")
            raise
        except Exception as e:
            logger.error("pdf_parse_error", error=str(e))
            raise


class HTMLParser(DocumentParser):
    """Parse HTML files."""
    
    @property
    def supported_types(self) -> List[str]:
        return ["text/html", ".html", ".htm"]
    
    async def parse(self, source: str, content: bytes = None) -> IngestedDocument:
        try:
            from bs4 import BeautifulSoup
            
            if content:
                html = content.decode("utf-8", errors="replace")
            else:
                html = Path(source).read_text(encoding="utf-8", errors="replace")
            
            soup = BeautifulSoup(html, "html.parser")
            
            # Remove script and style elements
            for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
                element.decompose()
            
            title = soup.find("title")
            title_text = title.get_text(strip=True) if title else Path(source).name
            
            # Extract main content
            main = soup.find("main") or soup.find("article") or soup.find("div", class_="content")
            if main:
                text = main.get_text(separator="\n", strip=True)
            else:
                text = soup.get_text(separator="\n", strip=True)
            
            # Clean up whitespace
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            text = "\n".join(lines)
            
            return IngestedDocument(
                id=str(uuid4()),
                source=source,
                title=title_text,
                content=text,
                doc_type="html",
                metadata={"url": source},
            )
        except ImportError:
            logger.error("beautifulsoup_not_installed")
            raise


class ChunkingStrategy(ABC):
    """Base class for text chunking strategies."""
    
    @abstractmethod
    def chunk(self, text: str, document_id: str, chunk_size: int, chunk_overlap: int) -> List[Chunk]:
        """Split text into chunks."""
        pass


class RecursiveCharacterChunking(ChunkingStrategy):
    """Recursively chunk text by characters with overlap."""
    
    def chunk(self, text: str, document_id: str, chunk_size: int, chunk_overlap: int) -> List[Chunk]:
        separators = ["\n\n", "\n", ". ", " ", ""]
        chunks = []
        
        def recursive_split(text: str, sep_idx: int) -> List[str]:
            if sep_idx >= len(separators):
                return [text] if text else []
            
            sep = separators[sep_idx]
            if not sep:
                # Character-level split
                return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size - chunk_overlap)]
            
            parts = text.split(sep)
            result = []
            current = ""
            
            for part in parts:
                candidate = (current + sep + part).strip() if current else part
                
                if len(candidate) <= chunk_size:
                    current = candidate
                else:
                    if current:
                        result.append(current)
                    if len(part) > chunk_size:
                        result.extend(recursive_split(part, sep_idx + 1))
                    else:
                        current = part
            
            if current:
                result.append(current)
            
            return result
        
        split_texts = recursive_split(text, 0)
        
        for i, chunk_text in enumerate(split_texts):
            chunk = Chunk(
                id=str(uuid4()),
                content=chunk_text,
                document_id=document_id,
                chunk_index=i,
                total_chunks=len(split_texts),
            )
            chunks.append(chunk)
        
        return chunks


class SemanticChunking(ChunkingStrategy):
    """Chunk text at semantic boundaries (paragraphs, sections)."""
    
    def chunk(self, text: str, document_id: str, chunk_size: int, chunk_overlap: int) -> List[Chunk]:
        # Split by headings and paragraphs
        sections = re.split(r'(?m)^#{1,6}\s+.+$', text)
        
        chunks = []
        current_chunk = ""
        chunk_idx = 0
        
        for section in sections:
            section = section.strip()
            if not section:
                continue
            
            if len(current_chunk) + len(section) + 2 <= chunk_size:
                current_chunk += "\n\n" + section if current_chunk else section
            else:
                if current_chunk:
                    chunks.append(Chunk(
                        id=str(uuid4()),
                        content=current_chunk,
                        document_id=document_id,
                        chunk_index=chunk_idx,
                        total_chunks=0,
                    ))
                    chunk_idx += 1
                
                # Handle section larger than chunk_size
                if len(section) > chunk_size:
                    paragraphs = section.split("\n\n")
                    for para in paragraphs:
                        if len(para) > chunk_size:
                            # Further split by sentences
                            sentences = para.split(". ")
                            temp = ""
                            for sent in sentences:
                                if len(temp) + len(sent) + 2 <= chunk_size:
                                    temp += ". " + sent if temp else sent
                                else:
                                    if temp:
                                        chunks.append(Chunk(
                                            id=str(uuid4()),
                                            content=temp,
                                            document_id=document_id,
                                            chunk_index=chunk_idx,
                                            total_chunks=0,
                                        ))
                                        chunk_idx += 1
                                    temp = sent
                            if temp:
                                current_chunk = temp
                        else:
                            current_chunk = para
                else:
                    current_chunk = section
        
        if current_chunk:
            chunks.append(Chunk(
                id=str(uuid4()),
                content=current_chunk,
                document_id=document_id,
                chunk_index=chunk_idx,
                total_chunks=0,
            ))
        
        # Update total chunks
        for i, chunk in enumerate(chunks):
            chunk.chunk_index = i
            chunk.total_chunks = len(chunks)
        
        return chunks


class RAGPipeline:
    """
    Complete RAG pipeline for document processing and question answering.
    """
    
    def __init__(
        self,
        vector_store: VectorStore,
        llm_provider: str = "ollama",
        llm_model: str = "llama3.2",
        embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2",
        chunk_size: int = None,
        chunk_overlap: int = None,
        top_k: int = None,
    ):
        self.vector_store = vector_store
        self.llm = LLMProvider.get_provider(llm_provider)
        self.llm_model = llm_model
        self.embedding_model = embedding_model
        self.chunk_size = chunk_size or settings.RAG_CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.RAG_CHUNK_OVERLAP
        self.top_k = top_k or settings.RAG_TOP_K
        
        self.parsers: Dict[str, DocumentParser] = {
            "text": TextParser(),
            "pdf": PDFParser(),
            "html": HTMLParser(),
        }
        self.chunking_strategy = RecursiveCharacterChunking()
        self.documents: Dict[str, IngestedDocument] = {}
        self.logger = get_logger("rag_pipeline")
        
    async def ingest_document(
        self,
        source: str,
        content: bytes = None,
        doc_type: str = None,
        metadata: Dict[str, Any] = None,
    ) -> IngestedDocument:
        """Ingest a document into the RAG system."""
        start = datetime.utcnow()
        
        # Detect type
        if not doc_type:
            if content:
                # Try to detect from content
                if content[:4] == b"%PDF":
                    doc_type = "pdf"
                elif b"<html" in content[:100].lower():
                    doc_type = "html"
                else:
                    doc_type = "text"
            else:
                ext = Path(source).suffix.lower()
                if ext == ".pdf":
                    doc_type = "pdf"
                elif ext in [".html", ".htm"]:
                    doc_type = "html"
                else:
                    doc_type = "text"
        
        # Parse document
        parser = self.parsers.get(doc_type, self.parsers["text"])
        document = await parser.parse(source, content)
        
        if metadata:
            document.metadata.update(metadata)
        
        # Chunk document
        document.chunks = self.chunking_strategy.chunk(
            document.content,
            document.id,
            self.chunk_size,
            self.chunk_overlap,
        )
        
        # Generate embeddings and store
        chunk_texts = [chunk.content for chunk in document.chunks]
        embeddings = await self.llm.embed(chunk_texts, self.embedding_model)
        
        for chunk, embedding in zip(document.chunks, embeddings):
            chunk.embedding = embedding
            
            vector_doc = VectorDocument(
                id=chunk.id,
                content=chunk.content,
                embedding=embedding,
                metadata={
                    "document_id": document.id,
                    "document_title": document.title,
                    "document_source": document.source,
                    "chunk_index": chunk.chunk_index,
                    "total_chunks": chunk.total_chunks,
                    **document.metadata,
                },
            )
            await self.vector_store.upsert([vector_doc])
        
        self.documents[document.id] = document
        
        duration = (datetime.utcnow() - start).total_seconds() * 1000
        self.logger.info(
            "document_ingested",
            document_id=document.id,
            title=document.title,
            chunks=len(document.chunks),
            duration_ms=duration,
        )
        
        return document
    
    async def query(
        self,
        query: str,
        top_k: int = None,
        filter_metadata: Dict[str, Any] = None,
        include_sources: bool = True,
        system_prompt: str = None,
    ) -> RAGResponse:
        """Query the RAG system."""
        total_start = datetime.utcnow()
        top_k = top_k or self.top_k
        
        # Embed query
        query_embedding = (await self.llm.embed([query], self.embedding_model))[0]
        
        # Retrieve similar chunks
        retrieval_start = datetime.utcnow()
        similar_docs = await self.vector_store.search(
            query_embedding,
            top_k=top_k,
            filter_metadata=filter_metadata,
        )
        retrieval_time = (datetime.utcnow() - retrieval_start).total_seconds() * 1000
        
        # Build context
        contexts = []
        sources = []
        
        for i, doc in enumerate(similar_docs):
            score = doc.get("score", 0.0)
            if score < settings.RAG_SIMILARITY_THRESHOLD:
                continue
            
            contexts.append(f"[Source {i + 1}]\n{doc['content']}\n")
            
            chunk = Chunk(
                id=doc["id"],
                content=doc["content"],
                document_id=doc["metadata"].get("document_id", ""),
                chunk_index=doc["metadata"].get("chunk_index", 0),
                total_chunks=doc["metadata"].get("total_chunks", 0),
                metadata=doc["metadata"],
            )
            sources.append(RetrievalResult(chunk=chunk, score=score, rank=i + 1))
        
        context_text = "\n---\n".join(contexts)
        
        # Generate answer
        generation_start = datetime.utcnow()
        
        default_prompt = """You are a helpful assistant. Answer the user's question based on the provided context.
If the context doesn't contain the answer, say so honestly.
Always cite the sources you use.

Context:
{context}

Question: {query}

Answer:"""
        
        prompt = (system_prompt or default_prompt).format(
            context=context_text,
            query=query,
        )
        
        response = await self.llm.chat(
            messages=[LLMMessage(role="user", content=prompt)],
            model=self.llm_model,
            temperature=0.3,
            max_tokens=2048,
        )
        
        generation_time = (datetime.utcnow() - generation_start).total_seconds() * 1000
        total_time = (datetime.utcnow() - total_start).total_seconds() * 1000
        
        self.logger.info(
            "rag_query_completed",
            query=query[:100],
            sources_found=len(sources),
            total_time_ms=total_time,
        )
        
        return RAGResponse(
            query=query,
            answer=response.content,
            sources=sources,
            context_used=context_text,
            model=self.llm_model,
            tokens_used=response.tokens_used,
            retrieval_time_ms=retrieval_time,
            generation_time_ms=generation_time,
            total_time_ms=total_time,
        )
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document and its chunks from the system."""
        if document_id not in self.documents:
            return False
        
        document = self.documents[document_id]
        chunk_ids = [chunk.id for chunk in document.chunks]
        
        await self.vector_store.delete(chunk_ids)
        del self.documents[document_id]
        
        self.logger.info("document_deleted", document_id=document_id)
        return True
    
    def list_documents(self) -> List[Dict[str, Any]]:
        """List all ingested documents."""
        return [
            {
                "id": doc.id,
                "title": doc.title,
                "source": doc.source,
                "type": doc.doc_type,
                "chunks": len(doc.chunks),
                "created_at": doc.created_at.isoformat(),
                "metadata": doc.metadata,
            }
            for doc in self.documents.values()
        ]
    
    async def hybrid_search(
        self,
        query: str,
        keyword_weight: float = 0.3,
        semantic_weight: float = 0.7,
        top_k: int = None,
    ) -> List[RetrievalResult]:
        """Combine keyword and semantic search."""
        top_k = top_k or self.top_k
        
        # Semantic search
        query_embedding = (await self.llm.embed([query], self.embedding_model))[0]
        semantic_results = await self.vector_store.search(query_embedding, top_k=top_k * 2)
        
        # Keyword search (simple TF-IDF style)
        query_terms = set(query.lower().split())
        keyword_scores = {}
        
        for doc_id, doc in self.documents.items():
            for chunk in doc.chunks:
                chunk_terms = set(chunk.content.lower().split())
                overlap = len(query_terms & chunk_terms)
                if overlap > 0:
                    keyword_scores[chunk.id] = overlap / len(query_terms)
        
        # Combine scores
        combined_scores = {}
        
        for result in semantic_results:
            chunk_id = result["id"]
            semantic_score = result.get("score", 0)
            combined_scores[chunk_id] = semantic_weight * semantic_score
        
        for chunk_id, keyword_score in keyword_scores.items():
            if chunk_id in combined_scores:
                combined_scores[chunk_id] += keyword_weight * keyword_score
            else:
                combined_scores[chunk_id] = keyword_weight * keyword_score
        
        # Sort and return top results
        sorted_results = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
        
        # Map back to chunks
        chunk_map = {}
        for doc in self.documents.values():
            for chunk in doc.chunks:
                chunk_map[chunk.id] = chunk
        
        results = []
        for i, (chunk_id, score) in enumerate(sorted_results):
            if chunk_id in chunk_map:
                results.append(RetrievalResult(
                    chunk=chunk_map[chunk_id],
                    score=score,
                    rank=i + 1,
                ))
        
        return results
