"""
BRX SYSTEM - Vector Store Abstractions
Support for multiple vector databases: Chroma, Qdrant, Weaviate, Milvus, FAISS
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from uuid import uuid4

import numpy as np
from src.core.logging import get_logger
from src.config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


@dataclass
class VectorDocument:
    """Document stored in vector database."""
    id: str
    content: str
    embedding: List[float]
    metadata: Dict[str, Any] = field(default_factory=dict)


class VectorStore(ABC):
    """Base class for vector stores."""
    
    def __init__(self, name: str, dimension: int):
        self.name = name
        self.dimension = dimension
        self.logger = get_logger(f"vectorstore.{name}")
        
    @abstractmethod
    async def upsert(self, documents: List[VectorDocument]) -> None:
        """Insert or update documents."""
        pass
    
    @abstractmethod
    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Search for similar documents."""
        pass
    
    @abstractmethod
    async def delete(self, document_ids: List[str]) -> None:
        """Delete documents by ID."""
        pass
    
    @abstractmethod
    async def get(self, document_id: str) -> Optional[VectorDocument]:
        """Get a document by ID."""
        pass
    
    @abstractmethod
    async def count(self) -> int:
        """Count total documents."""
        pass
    
    @abstractmethod
    async def clear(self) -> None:
        """Clear all documents."""
        pass


class ChromaVectorStore(VectorStore):
    """ChromaDB vector store implementation."""
    
    def __init__(self, collection_name: str = "brx_documents", dimension: int = None):
        super().__init__("chroma", dimension or settings.EMBEDDING_DIMENSION)
        self.collection_name = collection_name
        self.client = None
        self.collection = None
        self._initialize()
        
    def _initialize(self):
        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings
            
            self.client = chromadb.Client(
                ChromaSettings(
                    chroma_server_host=settings.CHROMA_HOST,
                    chroma_server_http_port=settings.CHROMA_PORT,
                    anonymized_telemetry=False,
                )
            )
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"dimension": self.dimension},
            )
            self.logger.info("chroma_initialized", collection=self.collection_name)
        except ImportError:
            self.logger.error("chromadb_not_installed")
        except Exception as e:
            self.logger.error("chroma_init_error", error=str(e))
    
    async def upsert(self, documents: List[VectorDocument]) -> None:
        if not self.collection:
            raise RuntimeError("Chroma collection not initialized")
        
        ids = [doc.id for doc in documents]
        embeddings = [doc.embedding for doc in documents]
        documents_text = [doc.content for doc in documents]
        metadatas = [doc.metadata for doc in documents]
        
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents_text,
            metadatas=metadatas,
        )
        
        self.logger.info("chroma_upsert", count=len(documents))
    
    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        if not self.collection:
            raise RuntimeError("Chroma collection not initialized")
        
        where = filter_metadata if filter_metadata else None
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where,
            include=["documents", "metadatas", "distances"],
        )
        
        output = []
        for i in range(len(results["ids"][0])):
            distance = results["distances"][0][i]
            score = 1.0 / (1.0 + distance)  # Convert distance to similarity
            
            output.append({
                "id": results["ids"][0][i],
                "content": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "score": score,
            })
        
        return output
    
    async def delete(self, document_ids: List[str]) -> None:
        if not self.collection:
            raise RuntimeError("Chroma collection not initialized")
        
        self.collection.delete(ids=document_ids)
        self.logger.info("chroma_delete", count=len(document_ids))
    
    async def get(self, document_id: str) -> Optional[VectorDocument]:
        if not self.collection:
            return None
        
        result = self.collection.get(
            ids=[document_id],
            include=["documents", "embeddings", "metadatas"],
        )
        
        if result["ids"]:
            return VectorDocument(
                id=result["ids"][0],
                content=result["documents"][0],
                embedding=result["embeddings"][0],
                metadata=result["metadatas"][0],
            )
        return None
    
    async def count(self) -> int:
        if not self.collection:
            return 0
        return self.collection.count()
    
    async def clear(self) -> None:
        if not self.collection:
            return
        
        ids = self.collection.get()["ids"]
        if ids:
            self.collection.delete(ids=ids)
        self.logger.info("chroma_cleared")


class QdrantVectorStore(VectorStore):
    """Qdrant vector store implementation."""
    
    def __init__(self, collection_name: str = "brx_documents", dimension: int = None):
        super().__init__("qdrant", dimension or settings.EMBEDDING_DIMENSION)
        self.collection_name = collection_name
        self.client = None
        self._initialize()
        
    def _initialize(self):
        try:
            from qdrant_client import QdrantClient
            
            self.client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
                api_key=settings.QDRANT_API_KEY,
            )
            
            # Create collection if not exists
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if self.collection_name not in collection_names:
                from qdrant_client.models import Distance, VectorParams
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=self.dimension, distance=Distance.COSINE),
                )
                self.logger.info("qdrant_collection_created", name=self.collection_name)
            
            self.logger.info("qdrant_initialized")
        except ImportError:
            self.logger.error("qdrant_not_installed")
        except Exception as e:
            self.logger.error("qdrant_init_error", error=str(e))
    
    async def upsert(self, documents: List[VectorDocument]) -> None:
        if not self.client:
            raise RuntimeError("Qdrant client not initialized")
        
        from qdrant_client.models import PointStruct
        
        points = [
            PointStruct(
                id=doc.id,
                vector=doc.embedding,
                payload={"content": doc.content, **doc.metadata},
            )
            for doc in documents
        ]
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=points,
        )
        
        self.logger.info("qdrant_upsert", count=len(documents))
    
    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        if not self.client:
            raise RuntimeError("Qdrant client not initialized")
        
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        
        qdrant_filter = None
        if filter_metadata:
            conditions = []
            for key, value in filter_metadata.items():
                conditions.append(
                    FieldCondition(key=key, match=MatchValue(value=value))
                )
            qdrant_filter = Filter(must=conditions)
        
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=top_k,
            query_filter=qdrant_filter,
        )
        
        return [
            {
                "id": result.id,
                "content": result.payload.get("content", ""),
                "metadata": {k: v for k, v in result.payload.items() if k != "content"},
                "score": result.score,
            }
            for result in results
        ]
    
    async def delete(self, document_ids: List[str]) -> None:
        if not self.client:
            return
        
        from qdrant_client.models import PointIdsList
        
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=PointIdsList(points=document_ids),
        )
        
        self.logger.info("qdrant_delete", count=len(document_ids))
    
    async def get(self, document_id: str) -> Optional[VectorDocument]:
        if not self.client:
            return None
        
        result = self.client.retrieve(
            collection_name=self.collection_name,
            ids=[document_id],
            with_vectors=True,
        )
        
        if result:
            return VectorDocument(
                id=result[0].id,
                content=result[0].payload.get("content", ""),
                embedding=result[0].vector,
                metadata={k: v for k, v in result[0].payload.items() if k != "content"},
            )
        return None
    
    async def count(self) -> int:
        if not self.client:
            return 0
        
        result = self.client.count(collection_name=self.collection_name)
        return result.count
    
    async def clear(self) -> None:
        if not self.client:
            return
        
        self.client.delete_collection(self.collection_name)
        self.logger.info("qdrant_collection_deleted")


class InMemoryVectorStore(VectorStore):
    """Simple in-memory vector store for development/testing."""
    
    def __init__(self, dimension: int = None):
        super().__init__("memory", dimension or settings.EMBEDDING_DIMENSION)
        self.documents: Dict[str, VectorDocument] = {}
        
    async def upsert(self, documents: List[VectorDocument]) -> None:
        for doc in documents:
            self.documents[doc.id] = doc
        self.logger.info("memory_upsert", count=len(documents))
    
    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        query_np = np.array(query_embedding)
        
        scored = []
        for doc in self.documents.values():
            # Filter
            if filter_metadata:
                skip = False
                for key, value in filter_metadata.items():
                    if doc.metadata.get(key) != value:
                        skip = True
                        break
                if skip:
                    continue
            
            # Cosine similarity
            doc_embedding = np.array(doc.embedding)
            similarity = np.dot(query_np, doc_embedding) / (
                np.linalg.norm(query_np) * np.linalg.norm(doc_embedding)
            )
            scored.append((similarity, doc))
        
        scored.sort(reverse=True)
        
        return [
            {
                "id": doc.id,
                "content": doc.content,
                "metadata": doc.metadata,
                "score": float(score),
            }
            for score, doc in scored[:top_k]
        ]
    
    async def delete(self, document_ids: List[str]) -> None:
        for doc_id in document_ids:
            if doc_id in self.documents:
                del self.documents[doc_id]
        self.logger.info("memory_delete", count=len(document_ids))
    
    async def get(self, document_id: str) -> Optional[VectorDocument]:
        return self.documents.get(document_id)
    
    async def count(self) -> int:
        return len(self.documents)
    
    async def clear(self) -> None:
        self.documents.clear()
        self.logger.info("memory_cleared")


def create_vector_store(store_type: str = "memory", **kwargs) -> VectorStore:
    """Factory function to create vector stores."""
    if store_type == "chroma":
        return ChromaVectorStore(**kwargs)
    elif store_type == "qdrant":
        return QdrantVectorStore(**kwargs)
    elif store_type == "memory":
        return InMemoryVectorStore(**kwargs)
    else:
        raise ValueError(f"Unknown vector store type: {store_type}")
