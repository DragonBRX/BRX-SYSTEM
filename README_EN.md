# BRX SYSTEM - Open Source AI Platform

> For the Portuguese (Brazil) version, see [README.md](README.md).

A comprehensive, production-ready open-source platform for managing, deploying, and orchestrating AI models, agents, knowledge bases, and workflows.

## Overview

BRX System aggregates the best open-source AI projects from the community into a single unified platform. It provides a complete ecosystem for running local and remote AI models, building autonomous agents, creating RAG pipelines, and designing multi-step automation workflows.

## Architecture

### Frontend
- React 19 with TypeScript
- Vite build system
- Tailwind CSS + shadcn/ui component library (40+ components)
- React Router v7 for navigation

### Backend
- Hono HTTP server
- tRPC 11 with end-to-end type safety
- Drizzle ORM with MySQL
- OAuth 2.0 authentication

### Data Layer
- MySQL database with relational schema
- Drizzle migrations and connection pooling
- JSON support for flexible metadata storage

## Features

### 1. Model Explorer
Discover and manage open-source AI models including LLaMA, DeepSeek, Mistral, Qwen, Gemma, Phi, LLaVA, Stable Diffusion, Whisper, and CodeLlama.

### 2. Universal Chat Interface
Multi-model chat with conversation history, system prompt customization, temperature and max token controls. Supports local (Ollama, llama.cpp, vLLM) and remote providers.

### 3. Agent Builder
Create autonomous AI agents with custom system prompts, tool integration, memory management, knowledge base attachments, and public/private sharing.

### 4. Knowledge Base / RAG
Build retrieval-augmented generation systems with vector store integrations (ChromaDB, Qdrant, Weaviate, Milvus, pgvector), configurable chunking, document ingestion, and semantic search.

### 5. Workflow Engine
Design complex automation pipelines with visual node-based builder, multiple trigger types, LLM/agent/data processing nodes, and execution monitoring.

### 6. Integrations & MCP
Connect external services: Ollama, OpenAI, Anthropic, Google, HuggingFace, Model Context Protocol (MCP) servers, and custom OpenAI-compatible endpoints.

### 7. Google Colab Support
Run BRX SYSTEM directly in Google Colab notebooks:
- Normal mode via cloud APIs
- Multi-agent orchestration optimized for free tier
- Local model execution with Ollama/llama.cpp on Colab CPU

## Quick Start

```bash
git clone https://github.com/DragonBRX/BRX-SYSTEM.git
cd BRX-SYSTEM
npm install
npm run db:push
npm run dev
```

## Google Colab Notebooks
- [BRX_System_Normal.ipynb](colab/BRX_System_Normal.ipynb)
- [BRX_System_MultiAgent.ipynb](colab/BRX_System_MultiAgent.ipynb)
- [BRX_System_Local.ipynb](colab/BRX_System_Local.ipynb)

## Documentation
- [GETTING_STARTED.md](docs/GETTING_STARTED.md)
- [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [API_REFERENCE.md](docs/API_REFERENCE.md)
- [CATALOG.md](CATALOG.md)

## License
MIT License — Open Source

---
Built by the community, for the community.
