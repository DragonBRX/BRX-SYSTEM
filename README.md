# BRX SYSTEM - Open Source AI Platform

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
Discover and manage open-source AI models including:
- Large Language Models (LLaMA, DeepSeek, Mistral, Qwen, Gemma, Phi)
- Vision Models (LLaVA, Qwen-VL, Stable Diffusion)
- Audio Models (Whisper)
- Embedding Models (Nomic Embed)
- Code Models (CodeLlama)

Each model entry includes architecture details, parameter counts, quantization options, context window sizes, licensing information, and source URLs.

### 2. Universal Chat Interface
- Multi-model chat with conversation history
- System prompt customization
- Temperature and max token controls
- Support for both local (Ollama, llama.cpp, vLLM) and remote providers

### 3. Agent Builder
Create autonomous AI agents with:
- Custom system prompts
- Tool integration framework
- Memory management with configurable window sizes
- Knowledge base attachments
- Public/private sharing

### 4. Knowledge Base / RAG
Build retrieval-augmented generation systems:
- Vector store integrations (ChromaDB, Qdrant, Weaviate, Milvus, pgvector)
- Configurable chunking strategies
- Document ingestion and indexing
- Semantic search and query interfaces

### 5. Workflow Engine
Design complex automation pipelines:
- Visual node-based workflow builder
- Multiple trigger types (manual, scheduled, webhook, event)
- Integration with LLM nodes, agent nodes, and data processing nodes
- Execution history and monitoring

### 6. Integrations & MCP
Connect external services:
- Ollama for local inference
- OpenAI, Anthropic, Google for cloud APIs
- HuggingFace for model hub access
- Model Context Protocol (MCP) server support
- Custom OpenAI-compatible endpoints

## Database Schema

### Tables
- `users` - Platform users with OAuth authentication
- `ai_models` - Catalog of available AI models with metadata
- `conversations` - Chat sessions with model configuration
- `messages` - Individual chat messages with tool calls
- `agents` - Configurable AI agents with tools and memory
- `knowledge_bases` - RAG vector collections
- `documents` - Indexed documents with chunking metadata
- `workflows` - Multi-step automation definitions
- `integrations` - External AI provider connections
- `mcp_servers` - Model Context Protocol server configurations
- `generation_tasks` - Async generation job tracking

## Open Source Integrations

### LLM Inference Engines
- **Ollama** - Easy local model management
- **llama.cpp** - High-performance C++ inference
- **vLLM** - Throughput-optimized serving
- **ipex-llm** - Intel-optimized inference

### Agent Frameworks
- **LangChain** - Composable LLM applications
- **LangGraph** - Stateful agent workflows
- **Agno** - Multi-agent orchestration
- **VoltAgent** - TypeScript agent framework
- **AutoGen** - Multi-agent conversation

### RAG & Vector Stores
- **ChromaDB** - AI-native vector database
- **Qdrant** - High-performance vector search
- **Weaviate** - Vector search engine
- **Milvus** - Cloud-native vector database

### Vision & Multimodal
- **LLaVA** - Large Language and Vision Assistant
- **Qwen-VL** - Vision-language foundation model
- **Stable Diffusion** - Text-to-image generation
- **LLaVA-OneVision** - Fully open multimodal training

### Speech & Audio
- **Whisper** - OpenAI speech recognition
- **whisper.cpp** - C++ port for local inference

### Model Context Protocol
- **MCP Toolbox** - Database connectivity
- **MCP Servers Registry** - Community server collection
- **Qdrant MCP** - Vector store integration

## Development

### Prerequisites
- Node.js 20+
- MySQL database
- npm or pnpm

### Installation
```bash
git clone https://github.com/DragonBRX/BRX-SYSTEM.git
cd BRX-SYSTEM
npm install
```

### Environment Setup
Create `.env` with database and OAuth credentials.

### Database Setup
```bash
npm run db:push
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production |
| `npm run check` | Type-check all files |
| `npm run db:push` | Sync schema to database |
| `npm run db:generate` | Generate migration SQL |
| `npm run db:migrate` | Apply pending migrations |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run tests with Vitest |

## API Endpoints (tRPC Routers)

### AI Router (`/api/trpc/ai`)
- `modelList` - List all active models
- `modelSearch` - Search models by query and category
- `modelById` - Get model details
- `createModel` / `updateModel` / `deleteModel` - Model CRUD
- `conversationList` / `conversationById` - Conversation queries
- `createConversation` / `updateConversation` / `deleteConversation` - Conversation CRUD
- `sendMessage` - Add message to conversation
- `generate` - Run async generation task
- `generationStatus` / `generationHistory` - Generation tracking
- `seedModels` - Seed default open-source models

### Agent Router (`/api/trpc/agent`)
- `list` / `publicList` - Agent queries
- `byId` - Get agent details
- `create` / `update` / `delete` - Agent CRUD
- `run` - Execute agent with input

### Knowledge Router (`/api/trpc/knowledge`)
- `listBases` / `baseById` - Knowledge base queries
- `createBase` / `updateBase` / `deleteBase` - KB CRUD
- `addDocument` / `deleteDocument` - Document management
- `queryRag` - RAG semantic search

### Workflow Router (`/api/trpc/workflow`)
- `list` / `publicList` - Workflow queries
- `byId` - Get workflow details
- `create` / `update` / `delete` - Workflow CRUD
- `run` - Execute workflow

### Integration Router (`/api/trpc/integration`)
- `list` / `byId` - Integration queries
- `create` / `update` / `delete` - Integration CRUD
- `testConnection` - Validate endpoint connectivity

### MCP Router (`/api/trpc/mcp`)
- `list` - MCP server list
- `create` / `update` / `delete` - MCP server CRUD

## Deployment

### Docker
The platform can be containerized with Docker for easy deployment.

### Environment Variables
- `DATABASE_URL` - MySQL connection string
- `VITE_KIMI_AUTH_URL` - OAuth provider URL
- `VITE_APP_ID` - Application ID for OAuth

## Contributing

Contributions are welcome. Please follow the existing code style and submit pull requests with clear descriptions.

## License

MIT License - Open Source

## Acknowledgments

This platform integrates and builds upon the incredible work of the open-source AI community, including projects from Meta, DeepSeek, Alibaba, Mistral AI, Google, Microsoft, OpenAI, Nomic, Stability AI, and countless individual contributors.

---

Built by the community, for the community.
