# BRX SYSTEM

> **Open Source AI Integration Platform**
>
> A comprehensive ecosystem for discovering, cataloging, integrating, and deploying the best open-source AI projects from around the world.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/DragonBRX/BRX-SYSTEM)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://python.org)
[![Node](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Installation](#installation)
- [API Reference](#api-reference)
- [Modules](#modules)
- [Docker Deployment](#docker-deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

BRX SYSTEM is a production-ready open-source platform that consolidates AI capabilities from multiple sources into a unified system. It provides:

- **AI Agent Framework**: ReAct and Planning agents with tool usage, memory, and multi-agent orchestration
- **RAG Pipeline**: Document ingestion, chunking, embedding, and retrieval with multiple vector stores
- **LLM Abstraction**: Unified interface for OpenAI, Anthropic, Google, Cohere, Ollama, and HuggingFace
- **NLP Processing**: Classification, sentiment analysis, summarization, NER, and translation
- **Computer Vision**: Object detection, image classification, OCR, and face detection
- **Audio Processing**: Text-to-speech, speech-to-text, and audio enhancement
- **Project Catalog**: Automated discovery and cataloging of trending open-source AI projects
- **Web Dashboard**: Modern React-based management interface

---

## Architecture

```
BRX-SYSTEM/
├── apps/
│   ├── api/                    # FastAPI backend service
│   │   ├── src/
│   │   │   ├── main.py         # Application entry point
│   │   │   ├── config/         # Configuration management
│   │   │   ├── api/v1/routes/  # REST API endpoints
│   │   │   └── models/         # Database models
│   │   └── requirements.txt    # Python dependencies
│   │
│   ├── web/                    # React frontend application
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Page components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   └── store/          # State management
│   │   └── package.json        # Node.js dependencies
│   │
│   └── worker/                 # Celery background workers
│       └── src/
│           └── worker.py       # Task definitions
│
├── packages/
│   ├── core/                   # Core AI framework
│   │   ├── src/
│   │   │   ├── agents/         # Agent framework (ReAct, Planning)
│   │   │   ├── llm/            # LLM provider abstraction
│   │   │   ├── rag/            # RAG pipeline implementation
│   │   │   ├── vectorstore/    # Vector database interfaces
│   │   │   ├── memory/         # Conversation memory systems
│   │   │   ├── tools/          # Tool registry and built-in tools
│   │   │   ├── logging.py      # Structured logging
│   │   │   └── exceptions.py   # Custom exceptions
│   │
│   ├── nlp/                    # Natural Language Processing
│   │   ├── src/
│   │   │   ├── classification.py    # Text classification
│   │   │   ├── summarization.py     # Text summarization
│   │   │   ├── ner.py               # Named entity recognition
│   │   │   └── translation.py       # Language translation
│   │
│   ├── vision/                 # Computer Vision
│   │   ├── src/
│   │   │   ├── detection/      # Object detection (YOLO, etc.)
│   │   │   ├── classification/ # Image classification
│   │   │   └── ocr/            # Optical character recognition
│   │
│   ├── audio/                  # Audio Processing
│   │   ├── src/
│   │   │   ├── tts/            # Text-to-speech
│   │   │   ├── stt/            # Speech-to-text
│   │   │   └── enhancement/    # Audio enhancement
│   │
│   ├── integrations/           # Third-party integrations
│   │   ├── src/
│   │   │   ├── github/         # GitHub API integration
│   │   │   └── twitter/        # Twitter/X API integration
│   │
│   └── shared/                 # Shared utilities
│       └── src/
│           ├── types/          # TypeScript/Python type definitions
│           └── utils/          # Common utilities
│
├── infrastructure/
│   ├── docker/                 # Docker configurations
│   │   ├── docker-compose.yml
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.web
│   │   └── Dockerfile.worker
│   │
│   └── k8s/                    # Kubernetes manifests
│       └── deployment.yaml
│
├── scripts/
│   ├── setup.sh                # Environment setup
│   ├── github_scanner.py       # GitHub project scanner
│   └── auto_updater.py         # Auto-update project stats
│
├── configs/
│   └── .env.example            # Environment template
│
├── docs/                       # Documentation
│   ├── api/                    # API documentation
│   ├── guides/                 # User guides
│   └── architecture/           # Architecture docs
│
└── data/                       # Data storage
    ├── uploads/                # File uploads
    ├── models/                 # Downloaded ML models
    ├── raw/                    # Raw data
    └── processed/              # Processed data
```

---

## Features

### AI Agent Framework

- **ReAct Agents**: Reasoning + Acting with tool usage
- **Planning Agents**: Hierarchical task planning with sub-agents
- **Multi-Agent Orchestration**: Sequential, parallel, and supervisor strategies
- **Memory Systems**: Conversation buffer, persistent DB storage, Redis caching
- **Tool Registry**: Extensible tool system with 8+ built-in tools

### RAG System

- **Document Parsing**: PDF, HTML, Text with automatic type detection
- **Chunking Strategies**: Recursive character chunking, semantic chunking
- **Vector Stores**: ChromaDB, Qdrant, Weaviate, Milvus, FAISS, In-Memory
- **Hybrid Search**: Combine semantic and keyword search
- **Multi-format Support**: Direct text, file uploads, URL fetching

### LLM Providers

| Provider | Chat | Streaming | Embeddings | Models |
|----------|------|-----------|------------|--------|
| OpenAI | Yes | Yes | Yes | GPT-4o, GPT-4o-mini, GPT-3.5 |
| Anthropic | Yes | Yes | No | Claude 3.5 Sonnet, Claude 3 Opus |
| Ollama | Yes | Yes | Yes | Llama 3.2, Mistral, Qwen, CodeLlama |
| HuggingFace | Yes | No | Yes | Various open models |
| Google | Yes | No | Yes | Gemini models |
| Cohere | Yes | No | Yes | Command models |

### NLP Capabilities

- Text classification (zero-shot, fine-tuned, ensemble)
- Sentiment analysis
- Text summarization (extractive and abstractive)
- Named entity recognition
- Language translation

### Computer Vision

- Object detection (YOLOv8)
- Image classification (ResNet, EfficientNet)
- OCR (Tesseract, PaddleOCR)
- Face detection

### Audio Processing

- Text-to-speech (Coqui TTS, Edge TTS, pyttsx3)
- Speech-to-text (OpenAI Whisper)
- Audio enhancement (noise reduction, normalization)

---

## Installation

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker (optional, for containerized deployment)
- GPU (optional, for accelerated model inference)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/DragonBRX/BRX-SYSTEM.git
cd BRX-SYSTEM

# Run setup script
bash scripts/setup.sh

# Configure environment
cp configs/.env.example .env
# Edit .env with your API keys

# Start with Docker (recommended)
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Or start services individually
# API
cd apps/api
source venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Web Dashboard
cd apps/web
npm run dev
```

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| API | 8000 | FastAPI REST API |
| Web Dashboard | 3000 | React management UI |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache and message broker |
| ChromaDB | 8001 | Vector store |
| Qdrant | 6333 | Alternative vector store |
| Ollama | 11434 | Local LLM inference |

---

## API Reference

### Agents

```
POST /api/v1/agents/create          - Create new agent
GET  /api/v1/agents/list            - List all agents
POST /api/v1/agents/execute/{name}  - Execute agent
POST /api/v1/agents/execute-multi    - Multi-agent execution
GET  /api/v1/agents/templates        - List templates
```

### RAG

```
POST /api/v1/rag/query              - Query knowledge base
POST /api/v1/rag/ingest             - Ingest document
POST /api/v1/rag/upload             - Upload file
GET  /api/v1/rag/documents          - List documents
DELETE /api/v1/rag/documents/{id}   - Delete document
```

### Models

```
GET  /api/v1/models/providers        - List providers
GET  /api/v1/models/list             - List all models
POST /api/v1/models/chat             - Chat completion
POST /api/v1/models/embed            - Create embeddings
```

### NLP

```
POST /api/v1/nlp/sentiment          - Sentiment analysis
POST /api/v1/nlp/summarize          - Text summarization
POST /api/v1/nlp/ner                - Named entity extraction
```

### Vision

```
POST /api/v1/vision/detect           - Object detection
POST /api/v1/vision/classify        - Image classification
POST /api/v1/vision/ocr             - Text extraction
```

### Audio

```
POST /api/v1/audio/tts              - Text to speech
POST /api/v1/audio/stt              - Speech to text
```

Full API documentation is available at `/docs` when running the API server.

---

## Modules

### Agent Framework Usage

```python
from src.core.agents.base import AgentConfig, AgentRole, ReActAgent
from src.core.tools import create_default_tool_registry

# Create agent
config = AgentConfig(
    name="research_agent",
    role=AgentRole.RESEARCH,
    instructions="Research topics using web search and summarize findings.",
    tools=["web_search", "summarize"],
    llm_provider="ollama",
    model="llama3.2",
)

tools = create_default_tool_registry()
agent = ReActAgent(config, tools)

# Execute
result = await agent.execute("What are the latest developments in quantum computing?")
print(result.final_output)
```

### RAG Pipeline Usage

```python
from src.core.rag.pipeline import RAGPipeline
from src.core.vectorstore.base import create_vector_store

# Initialize
vector_store = create_vector_store("chroma")
rag = RAGPipeline(vector_store, llm_provider="ollama")

# Ingest document
await rag.ingest_document("document.pdf", doc_type="pdf")

# Query
response = await rag.query("What are the key findings?")
print(response.answer)
```

---

## Docker Deployment

```bash
# Start all services
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Scale API workers
docker-compose up -d --scale api=3

# View logs
docker-compose logs -f api

# Update
docker-compose pull
docker-compose up -d
```

---

## Project Catalog

BRX SYSTEM automatically tracks and catalogs open-source AI projects from GitHub and Twitter/X. Currently cataloged categories:

### AI Agents & Autonomous Systems
- AutoGPT, OpenHands, MetaGPT, CrewAI, SWE-agent
- Claude Code, Aider, Cline, Gemini CLI, Codex
- LangGraph, AutoGen, Agno, PraisonAI

### Large Language Models
- Ollama, llama.cpp, vLLM, LocalAI
- Open WebUI, text-generation-webui, LibreChat
- SillyTavern, text-generation-inference

### Frameworks & Orchestration
- LangChain, Langflow, LlamaIndex, Dify
- n8n, Flowise, DSPy
- CrewAI, AutoGen, VoltAgent

### RAG Systems
- RAGFlow, GraphRAG, Verba
- Quivr, Neo4j, Qdrant

### Computer Vision
- Stable Diffusion WebUI, InvokeAI, ComfyUI
- Diffusers, Blender-MCP
- YOLO, OpenCV, TIMM

### Audio Processing
- Whisper, Bark, Coqui TTS
- Piper TTS, SpeechBrain

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Open a Pull Request

Please ensure:
- Code follows project style guidelines
- Tests pass: `pytest`
- Documentation is updated
- No emojis in source code (reserved for documentation only)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

Special thanks to all the open-source AI projects that make this ecosystem possible:
- PyTorch, TensorFlow, JAX
- Hugging Face Transformers, Datasets
- LangChain, LlamaIndex
- Ollama, llama.cpp
- And hundreds more projects in the catalog

---

<p align="center">
  <strong>BRX SYSTEM - Building the future of Open Source AI</strong>
  <br>
  <a href="https://github.com/DragonBRX/BRX-SYSTEM">GitHub Repository</a>
</p>
