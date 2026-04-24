"""
BRX SYSTEM - Conversation Memory System
Short-term and long-term memory for agents
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import uuid4

from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class MemoryEntry:
    """Single memory entry."""
    id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = field(default_factory=datetime.utcnow)
    user_message: str = ""
    assistant_message: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    importance: float = 1.0  # For memory prioritization
    tags: List[str] = field(default_factory=list)
    session_id: str = "default"


class BaseMemory(ABC):
    """Base class for memory systems."""
    
    @abstractmethod
    def add_entry(self, entry: MemoryEntry) -> None:
        """Add a memory entry."""
        pass
    
    @abstractmethod
    def get_recent(self, n: int = 10) -> List[MemoryEntry]:
        """Get most recent entries."""
        pass
    
    @abstractmethod
    def search(self, query: str, top_k: int = 5) -> List[MemoryEntry]:
        """Search memory by semantic similarity or keyword."""
        pass
    
    @abstractmethod
    def get_by_session(self, session_id: str) -> List[MemoryEntry]:
        """Get all entries for a session."""
        pass
    
    @abstractmethod
    def clear(self) -> None:
        """Clear all memories."""
        pass
    
    @abstractmethod
    def summarize(self, entries: List[MemoryEntry] = None) -> str:
        """Generate summary of memories."""
        pass


class ConversationMemory(BaseMemory):
    """In-memory conversation buffer with summarization."""
    
    def __init__(self, max_entries: int = 50):
        self.entries: List[MemoryEntry] = []
        self.max_entries = max_entries
        self.logger = get_logger("conversation_memory")
        
    def add_entry(self, entry: MemoryEntry) -> None:
        self.entries.append(entry)
        
        if len(self.entries) > self.max_entries:
            removed = self.entries.pop(0)
            self.logger.debug("memory_entry_evicted", entry_id=removed.id)
        
        self.logger.info("memory_entry_added", entry_id=entry.id, session=entry.session_id)
        
    def get_recent(self, n: int = 10) -> List[MemoryEntry]:
        return self.entries[-n:] if n < len(self.entries) else self.entries
    
    def search(self, query: str, top_k: int = 5) -> List[MemoryEntry]:
        query_lower = query.lower()
        scored = []
        
        for entry in self.entries:
            score = 0
            if query_lower in entry.user_message.lower():
                score += 2
            if query_lower in entry.assistant_message.lower():
                score += 2
            for tag in entry.tags:
                if query_lower in tag.lower():
                    score += 1
            if score > 0:
                scored.append((score, entry))
        
        scored.sort(key=lambda x: x[0], reverse=True)
        return [entry for _, entry in scored[:top_k]]
    
    def get_by_session(self, session_id: str) -> List[MemoryEntry]:
        return [e for e in self.entries if e.session_id == session_id]
    
    def clear(self) -> None:
        self.entries.clear()
        self.logger.info("memory_cleared")
    
    def summarize(self, entries: List[MemoryEntry] = None) -> str:
        target = entries or self.entries
        if not target:
            return "No memories to summarize."
        
        summaries = []
        for entry in target:
            summaries.append(f"User: {entry.user_message[:200]}")
            summaries.append(f"Assistant: {entry.assistant_message[:200]}")
        
        return "\n".join(summaries)


class PersistentMemory(BaseMemory):
    """Persistent memory backed by database (PostgreSQL/SQLite)."""
    
    def __init__(self, db_url: str = None, table_name: str = "memories"):
        from sqlalchemy import create_engine, Column, String, DateTime, Float, Text, JSON
        from sqlalchemy.ext.declarative import declarative_base
        from sqlalchemy.orm import sessionmaker
        from src.config.settings import get_settings
        
        self.db_url = db_url or get_settings().DATABASE_URL
        self.table_name = table_name
        self.Base = declarative_base()
        
        class MemoryModel(self.Base):
            __tablename__ = table_name
            
            id = Column(String(36), primary_key=True)
            timestamp = Column(DateTime, default=datetime.utcnow)
            user_message = Column(Text)
            assistant_message = Column(Text)
            metadata_json = Column(JSON)
            importance = Column(Float, default=1.0)
            tags = Column(JSON, default=list)
            session_id = Column(String(100), default="default")
        
        self.MemoryModel = MemoryModel
        self.engine = create_engine(self.db_url)
        self.Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.logger = get_logger("persistent_memory")
        
    def add_entry(self, entry: MemoryEntry) -> None:
        session = self.Session()
        try:
            model = self.MemoryModel(
                id=entry.id,
                timestamp=entry.timestamp,
                user_message=entry.user_message,
                assistant_message=entry.assistant_message,
                metadata_json=entry.metadata,
                importance=entry.importance,
                tags=entry.tags,
                session_id=entry.session_id,
            )
            session.add(model)
            session.commit()
            self.logger.info("memory_persisted", entry_id=entry.id)
        finally:
            session.close()
    
    def get_recent(self, n: int = 10) -> List[MemoryEntry]:
        session = self.Session()
        try:
            models = session.query(self.MemoryModel).order_by(
                self.MemoryModel.timestamp.desc()
            ).limit(n).all()
            
            return [
                MemoryEntry(
                    id=m.id,
                    timestamp=m.timestamp,
                    user_message=m.user_message,
                    assistant_message=m.assistant_message,
                    metadata=m.metadata_json or {},
                    importance=m.importance,
                    tags=m.tags or [],
                    session_id=m.session_id,
                )
                for m in models
            ]
        finally:
            session.close()
    
    def search(self, query: str, top_k: int = 5) -> List[MemoryEntry]:
        session = self.Session()
        try:
            from sqlalchemy import or_
            
            models = session.query(self.MemoryModel).filter(
                or_(
                    self.MemoryModel.user_message.ilike(f"%{query}%"),
                    self.MemoryModel.assistant_message.ilike(f"%{query}%"),
                )
            ).order_by(self.MemoryModel.importance.desc()).limit(top_k).all()
            
            return [
                MemoryEntry(
                    id=m.id,
                    timestamp=m.timestamp,
                    user_message=m.user_message,
                    assistant_message=m.assistant_message,
                    metadata=m.metadata_json or {},
                    importance=m.importance,
                    tags=m.tags or [],
                    session_id=m.session_id,
                )
                for m in models
            ]
        finally:
            session.close()
    
    def get_by_session(self, session_id: str) -> List[MemoryEntry]:
        session = self.Session()
        try:
            models = session.query(self.MemoryModel).filter_by(
                session_id=session_id
            ).order_by(self.MemoryModel.timestamp.desc()).all()
            
            return [
                MemoryEntry(
                    id=m.id,
                    timestamp=m.timestamp,
                    user_message=m.user_message,
                    assistant_message=m.assistant_message,
                    metadata=m.metadata_json or {},
                    importance=m.importance,
                    tags=m.tags or [],
                    session_id=m.session_id,
                )
                for m in models
            ]
        finally:
            session.close()
    
    def clear(self) -> None:
        session = self.Session()
        try:
            session.query(self.MemoryModel).delete()
            session.commit()
            self.logger.info("persistent_memory_cleared")
        finally:
            session.close()
    
    def summarize(self, entries: List[MemoryEntry] = None) -> str:
        if entries is None:
            entries = self.get_recent(50)
        
        if not entries:
            return "No memories to summarize."
        
        # Group by session
        by_session = {}
        for entry in entries:
            sid = entry.session_id
            if sid not in by_session:
                by_session[sid] = []
            by_session[sid].append(entry)
        
        parts = []
        for sid, sess_entries in by_session.items():
            parts.append(f"Session {sid}: {len(sess_entries)} interactions")
            topics = set()
            for e in sess_entries:
                topics.update(e.tags)
            if topics:
                parts.append(f"  Topics: {', '.join(topics)}")
        
        return "\n".join(parts)


class RedisMemory(BaseMemory):
    """Redis-backed memory for distributed systems."""
    
    def __init__(self, redis_url: str = None, key_prefix: str = "brx:memory"):
        import redis.asyncio as redis
        from src.config.settings import get_settings
        
        self.client = redis.from_url(redis_url or get_settings().REDIS_URL)
        self.key_prefix = key_prefix
        self.logger = get_logger("redis_memory")
        
    def _key(self, session_id: str = "default") -> str:
        return f"{self.key_prefix}:{session_id}"
    
    async def add_entry(self, entry: MemoryEntry) -> None:
        key = self._key(entry.session_id)
        entry_data = {
            "id": entry.id,
            "timestamp": entry.timestamp.isoformat(),
            "user_message": entry.user_message,
            "assistant_message": entry.assistant_message,
            "metadata": entry.metadata,
            "importance": entry.importance,
            "tags": entry.tags,
        }
        
        import json
        await self.client.lpush(key, json.dumps(entry_data, default=str))
        await self.client.ltrim(key, 0, 999)  # Keep last 1000
        
        self.logger.info("redis_memory_added", entry_id=entry.id)
        
    async def get_recent(self, n: int = 10) -> List[MemoryEntry]:
        key = self._key()
        import json
        
        data = await self.client.lrange(key, 0, n - 1)
        entries = []
        
        for item in data:
            entry_data = json.loads(item)
            entries.append(MemoryEntry(
                id=entry_data["id"],
                timestamp=datetime.fromisoformat(entry_data["timestamp"]),
                user_message=entry_data["user_message"],
                assistant_message=entry_data["assistant_message"],
                metadata=entry_data.get("metadata", {}),
                importance=entry_data.get("importance", 1.0),
                tags=entry_data.get("tags", []),
            ))
        
        return entries
    
    async def search(self, query: str, top_k: int = 5) -> List[MemoryEntry]:
        # Redis doesn't support native search without RediSearch
        # Fallback: scan recent entries
        all_entries = await self.get_recent(100)
        query_lower = query.lower()
        
        scored = []
        for entry in all_entries:
            score = 0
            if query_lower in entry.user_message.lower():
                score += 1
            if query_lower in entry.assistant_message.lower():
                score += 1
            for tag in entry.tags:
                if query_lower in tag.lower():
                    score += 1
            if score > 0:
                scored.append((score, entry))
        
        scored.sort(key=lambda x: x[0], reverse=True)
        return [e for _, e in scored[:top_k]]
    
    async def get_by_session(self, session_id: str) -> List[MemoryEntry]:
        key = self._key(session_id)
        import json
        
        data = await self.client.lrange(key, 0, -1)
        entries = []
        
        for item in data:
            entry_data = json.loads(item)
            entries.append(MemoryEntry(
                id=entry_data["id"],
                timestamp=datetime.fromisoformat(entry_data["timestamp"]),
                user_message=entry_data["user_message"],
                assistant_message=entry_data["assistant_message"],
                metadata=entry_data.get("metadata", {}),
                importance=entry_data.get("importance", 1.0),
                tags=entry_data.get("tags", []),
                session_id=session_id,
            ))
        
        return entries
    
    async def clear(self) -> None:
        keys = await self.client.keys(f"{self.key_prefix}:*")
        if keys:
            await self.client.delete(*keys)
        self.logger.info("redis_memory_cleared")
    
    def summarize(self, entries: List[MemoryEntry] = None) -> str:
        return "Redis memory summary requires synchronous retrieval."
