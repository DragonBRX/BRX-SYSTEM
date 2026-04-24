# Getting Started with BRX System

## Overview

BRX System is a comprehensive, production-ready open-source platform for managing, deploying, and orchestrating AI models, agents, knowledge bases, and workflows. It integrates the best open-source AI projects from the community into a single unified platform.

## Prerequisites

- Node.js 20 or higher
- MySQL 8.0 or higher
- npm 10 or higher
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/DragonBRX/BRX-SYSTEM.git
cd BRX-SYSTEM
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the project root:

```env
DATABASE_URL=mysql://username:password@localhost:3306/brx_system
VITE_KIMI_AUTH_URL=https://your-auth-provider.com
VITE_APP_ID=your-app-id
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key
DEEPSEEK_API_KEY=your-deepseek-key
OLLAMA_BASE_URL=http://localhost:11434
```

### 4. Setup Database

```bash
npm run db:push
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 6. Build for Production

```bash
npm run build
npm start
```

## Features Guide

### Model Explorer

Browse and manage AI models from various providers:
- OpenAI (GPT-4o, GPT-4o-mini, o1, o3-mini)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku)
- Google (Gemini 2.0 Flash, Gemini 1.5 Pro)
- DeepSeek (DeepSeek-V3, DeepSeek-R1)
- Local models via Ollama (Llama, Mistral, Qwen, Phi, Gemma)

### Universal Chat

Multi-model chat interface with:
- Conversation history
- System prompt customization
- Temperature and max token controls
- Support for local and remote providers
- Streaming responses

### Agent Builder

Create autonomous AI agents with:
- Custom system prompts
- Tool integration framework
- Memory management with configurable window sizes
- Knowledge base attachments
- Public/private sharing

### Knowledge Base / RAG

Build retrieval-augmented generation systems:
- Vector store integrations (ChromaDB, Qdrant, Weaviate, Milvus, pgvector)
- Configurable chunking strategies (fixed, recursive, semantic, hierarchical)
- Document ingestion and indexing
- Semantic search and query interfaces

### Workflow Engine

Design complex automation pipelines:
- Visual node-based workflow builder
- Multiple trigger types (manual, scheduled, webhook, event)
- Integration with LLM nodes, agent nodes, and data processing nodes
- Execution history and monitoring

### Story Creator

AI-powered story generation with:
- Multiple genres (fantasy, sci-fi, horror, romance, mystery, thriller, adventure, dystopian, cyberpunk, steampunk)
- Configurable tone and target audience
- Character development
- Chapter-by-chapter generation
- Full story generation

### Code Assistant

Programming assistant with:
- Code generation in 30+ languages
- Code review and analysis
- Debugging and error fixing
- Test generation
- Code refactoring
- Language conversion
- Documentation generation

### Training Center

Model training management:
- Fine-tuning jobs
- RLHF and DPO training
- LoRA and QLoRA adapters
- GRPO training pipeline
- Dataset management
- Progress tracking

### Open Source Catalog

Curated catalog of open-source AI projects:
- 20+ featured projects
- Search and filter by category
- Direct links to GitHub and documentation
- Star counts and licensing info

## Architecture

### Frontend
- React 19 with TypeScript
- Vite build system
- Tailwind CSS + shadcn/ui (40+ components)
- React Router v7
- tRPC client with React Query

### Backend
- Hono HTTP server
- tRPC 11 with end-to-end type safety
- Drizzle ORM with MySQL
- OAuth 2.0 authentication
- Multiple AI provider integrations

### Data Layer
- MySQL database with relational schema
- Drizzle migrations and connection pooling
- JSON support for flexible metadata storage

## API Providers

### Supported Providers
1. **OpenAI** - GPT-4o, GPT-4o-mini, o1, o3-mini
2. **Anthropic** - Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
3. **Google** - Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash
4. **DeepSeek** - DeepSeek-V3, DeepSeek-R1, DeepSeek-Coder
5. **Ollama** - Local model execution (Llama, Mistral, Qwen, Phi, Gemma)

### Provider Configuration

Each provider can be configured through:
- Environment variables
- Integration settings UI
- API key management
- Custom endpoint URLs

## Database Schema

### Core Tables
- `users` - Platform users with OAuth authentication
- `ai_models` - Catalog of available AI models
- `conversations` - Chat sessions with model configuration
- `messages` - Individual chat messages with tool calls
- `agents` - Configurable AI agents with tools and memory
- `knowledge_bases` - RAG vector collections
- `documents` - Indexed documents with chunking metadata
- `workflows` - Multi-step automation definitions
- `integrations` - External AI provider connections
- `mcp_servers` - Model Context Protocol server configurations
- `generation_tasks` - Async generation job tracking
- `stories` - AI-generated stories with chapters
- `code_projects` - Code generation projects
- `training_jobs` - Model training job tracking
- `datasets` - Training datasets
- `prompts` - Reusable prompt templates
- `api_keys` - API key management
- `plugin_registry` - Plugin registration
- `open_source_catalog` - Open source project catalog

## Development

### Scripts
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
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
| `npm start` | Start production server |

### Project Structure
```
BRX-SYSTEM/
  api/                  # Backend API
    engine/             # AI engine core
    providers/          # AI provider implementations
    services/           # Business logic services
    routers/            # tRPC routers
    queries/            # Database queries
    lib/                # Utility libraries
    middleware.ts       # tRPC middleware
    router.ts           # Main router
    context.ts          # Request context
    boot.ts             # Server bootstrap
  src/                  # Frontend source
    pages/              # Page components
    components/         # Reusable components
    hooks/              # Custom React hooks
    lib/                # Frontend utilities
    providers/          # Context providers
  db/                   # Database
    schema.ts           # Drizzle schema
    relations.ts        # Table relations
    seed.ts             # Seed data
  contracts/            # Shared types
  docs/                 # Documentation
  scripts/              # Build scripts
  public/               # Static assets
```

## Docker Support

### Using Docker Compose

```bash
docker-compose up -d
```

This will start:
- BRX System application
- MySQL database
- Redis cache (optional)

### Environment Variables for Docker

```env
DATABASE_URL=mysql://root:password@mysql:3306/brx_system
NODE_ENV=production
PORT=3000
```

## Contributing

We welcome contributions from the community. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable names
- Add comments for complex logic
- Write tests for new features

## License

MIT License - Open Source

## Support

For support, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue with details

## Acknowledgments

This platform integrates and builds upon the incredible work of the open-source AI community, including projects from Meta, DeepSeek, Alibaba, Mistral AI, Google, Microsoft, OpenAI, Nomic, Stability AI, and countless individual contributors.

---

Built by the community, for the community.
