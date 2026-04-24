# Architecture Overview

BRX SYSTEM follows a modular, service-oriented architecture designed for scalability and extensibility.

## Design Principles

1. **Modularity**: Each component can operate independently
2. **Extensibility**: Easy to add new providers, models, and tools
3. **Scalability**: Supports horizontal scaling via containerization
4. **Observability**: Comprehensive logging, metrics, and tracing

## Component Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Web UI    │────▶│   API       │────▶│   Workers   │
│  (React)    │     │  (FastAPI)  │     │  (Celery)   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌────────┐  ┌──────────┐  ┌──────────┐
        │  LLM   │  │   RAG    │  │  Agents  │
        │Providers│  │ Pipeline │  │ Framework│
        └───┬────┘  └────┬─────┘  └────┬─────┘
            │            │            │
            ▼            ▼            ▼
        ┌─────────────────────────────────────┐
        │           Core Services              │
        │  ┌──────┐ ┌──────┐ ┌──────┐       │
        │  │Memory│ │Tools │ │Vector│       │
        │  │      │ │      │ │Store │       │
        │  └──────┘ └──────┘ └──────┘       │
        └─────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │Postgres │  │  Redis  │  │ Chroma  │
   │         │  │         │  │ /Qdrant │
   └─────────┘  └─────────┘  └─────────┘
```

## Request Flow

1. Client makes request to API
2. API authenticates and validates request
3. Business logic processes the request
4. External services (LLM, DB) are called as needed
5. Response is formatted and returned
6. Metrics and logs are recorded

## Data Flow

### Document Ingestion
1. Document uploaded via API
2. Parser extracts text content
3. Text split into chunks
4. Embeddings generated for each chunk
5. Chunks stored in vector database
6. Metadata stored in PostgreSQL

### Agent Execution
1. Query received with context
2. LLM generates reasoning steps
3. Tools invoked as needed
4. Observations collected
5. Final response generated
6. Execution logged to database
