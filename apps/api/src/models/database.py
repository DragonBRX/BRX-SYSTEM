"""
BRX SYSTEM - SQLAlchemy Database Models
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Text, JSON,
    Boolean, ForeignKey, create_engine, Index
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

from src.config.settings import get_settings

settings = get_settings()
Base = declarative_base()


class AgentModel(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False, unique=True)
    role = Column(String(50), nullable=False)
    description = Column(Text)
    instructions = Column(Text)
    llm_provider = Column(String(50), default="ollama")
    model = Column(String(100), default="llama3.2")
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=4096)
    tools = Column(JSON, default=list)
    memory_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    executions = relationship("AgentExecutionModel", back_populates="agent")


class AgentExecutionModel(Base):
    __tablename__ = "agent_executions"

    id = Column(String(36), primary_key=True)
    agent_id = Column(String(36), ForeignKey("agents.id"))
    query = Column(Text)
    output = Column(Text)
    status = Column(String(20))
    steps_count = Column(Integer, default=0)
    duration_ms = Column(Float)
    tokens_used = Column(Integer, default=0)
    tools_used = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("AgentModel", back_populates="executions")


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True)
    source = Column(String(500))
    title = Column(String(500))
    content = Column(Text)
    doc_type = Column(String(20))
    chunk_count = Column(Integer, default=0)
    metadata_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProjectModel(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    url = Column(String(500))
    category = Column(String(50))
    stars = Column(Integer, default=0)
    language = Column(String(50))
    tags = Column(JSON, default=list)
    metadata_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class MemoryModel(Base):
    __tablename__ = "memories"

    id = Column(String(36), primary_key=True)
    session_id = Column(String(100), default="default")
    user_message = Column(Text)
    assistant_message = Column(Text)
    metadata_json = Column(JSON)
    importance = Column(Float, default=1.0)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_database():
    """Initialize database tables."""
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(engine)
    return engine


def get_session_factory(engine):
    """Get session factory."""
    return sessionmaker(bind=engine)
