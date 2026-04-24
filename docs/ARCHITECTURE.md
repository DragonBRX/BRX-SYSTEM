# BRX System Architecture Documentation

## System Design

BRX System follows a modern fullstack architecture pattern optimized for AI workload management and extensibility.

### Component Overview

```
+----------------------------------+
|           Client Layer           |
|  React 19 + Tailwind + shadcn   |
+----------------------------------+
                |
                | HTTP / tRPC
                v
+----------------------------------+
|           API Layer              |
|  Hono + tRPC 11 + Zod           |
+----------------------------------+
                |
                | SQL / Queries
                v
+----------------------------------+
|           Data Layer             |
|  Drizzle ORM + MySQL 8.0        |
+----------------------------------+
                |
                | HTTP / gRPC
                v
+----------------------------------+
|        External Services         |
|  Ollama, vLLM, OpenAI, MCP     |
+----------------------------------+
```

## Frontend Architecture

### Routing
The application uses React Router v7 with the following route structure:
- `/` - Landing page with feature showcase
- `/dashboard` - Main dashboard with statistics
- `/models` - Model explorer and catalog
- `/chat` - Universal chat interface
- `/chat/:id` - Specific conversation view
- `/agents` - Agent builder and management
- `/knowledge` - Knowledge base and RAG management
- `/workflows` - Workflow designer and execution
- `/integrations` - External service connections
- `/settings` - User and system settings

### State Management
- tRPC React Query for server state
- React hooks for local component state
- URL params for route-level state

### Component Library
Utilizes shadcn/ui with 40+ pre-installed components:
- Layout: Card, Tabs, Dialog, Sheet, ScrollArea
- Forms: Input, Textarea, Select, Switch, Checkbox
- Feedback: Badge, Alert, Toast, Skeleton
- Navigation: Breadcrumb, Command, NavigationMenu
- Data: Table, Calendar, Chart

## Backend Architecture

### tRPC Router Structure
All API endpoints are organized into domain-specific routers:

#### Auth Router
Handles OAuth 2.0 authentication flow with Kimi platform integration. Manages JWT sessions, user creation, and role assignment.

#### AI Router
Manages the complete lifecycle of AI interactions:
- Model catalog with metadata
- Conversation persistence
- Message threading
- Async generation tasks

#### Agent Router
Provides CRUD operations for AI agents with execution capabilities. Agents support tool definitions, memory windows, and knowledge base attachments.

#### Knowledge Router
Implements RAG pipeline management:
- Vector store abstraction
- Document chunking configuration
- Semantic search simulation
- Collection management

#### Workflow Router
Supports DAG-based workflow definitions with execution tracking. Workflows can be triggered manually, on schedules, via webhooks, or by system events.

#### Integration Router
Manages connections to external AI providers with health checking. Supports API key storage and endpoint configuration.

#### MCP Router
Handles Model Context Protocol server registrations. Supports stdio, SSE, and HTTP transports.

### Middleware
- `publicQuery` - Unauthenticated access
- `authedQuery` - Requires valid session
- `adminQuery` - Requires admin role

### Database Patterns
- Lazy connection initialization via `getDb()`
- Type-safe queries using Drizzle query API
- JSON columns for flexible metadata
- Enum types for categorical fields
- Soft delete via `isActive` / `isArchived` flags

## Data Model

### User Entity
Central identity for authentication and authorization. Supports OAuth union IDs, role-based access control, and profile metadata.

### AI Model Entity
Catalog entry for available models. Includes technical specifications (architecture, parameters, quantization, context window), categorization (LLM, vision, audio, multimodal, embedding, code), and community metrics (downloads, rating).

### Conversation Entity
Chat session container. Links to user and model configuration. Stores generation parameters (temperature, max tokens) and system prompts.

### Message Entity
Individual chat turn. Supports standard roles (user, assistant, system, tool) with optional tool call and result serialization.

### Agent Entity
Configurable autonomous entity. Defines behavior through system prompts, model selection, temperature, and tool specifications. Memory configuration controls context window retention.

### Knowledge Base Entity
RAG collection definition. Configures embedding model, vector store backend, and chunking strategy. Tracks document count and public visibility.

### Document Entity
Indexed content unit. Stores original text, processing status, chunk count, and error tracking. Links to parent knowledge base.

### Workflow Entity
Automation definition. Serializes node graph (operations) and edge connections (data flow). Supports cron scheduling and webhook triggers.

### Integration Entity
External provider configuration. Stores endpoint URLs, API credentials, and connection health status.

### MCP Server Entity
Protocol endpoint registration. Captures transport type, launch command, environment variables, and available tool manifests.

### Generation Task Entity
Async job tracking. Records prompt, model, parameters, result, token usage, and execution duration.

## Security Considerations

- OAuth 2.0 for authentication
- JWT session management
- Role-based access control (user/admin)
- API keys stored encrypted in database
- Input validation via Zod schemas
- SQL injection prevention via parameterized queries
- XSS protection via React built-in escaping

## Scalability Patterns

- Stateless API design enables horizontal scaling
- MySQL connection pooling
- Static asset CDN distribution
- Container-ready with Docker
- Webhook-based async processing

## Extensibility Points

New model categories can be added by extending the `category` enum. Additional vector stores require implementing the knowledge router interface. New agent capabilities are added through tool JSON schemas. Custom integrations follow the OpenAI-compatible API specification.

## Performance Characteristics

- Frontend bundle: ~580KB gzipped
- Backend boot: ~2.3MB bundled
- Database: 12 tables with relational constraints
- API response time: <100ms for cached queries

## Monitoring and Observability

The platform is designed to integrate with:
- Application logs via structured JSON
- Health check endpoints for load balancers
- tRPC request tracing
- Database query performance via Drizzle debug mode

## Future Enhancements

Planned architecture improvements:
- WebSocket support for real-time chat streaming
- Redis caching layer for model metadata
- Queue system for async generation jobs
- Multi-tenant workspace isolation
- Fine-grained permission policies
- Audit logging for compliance

---

This architecture documentation reflects the current v2.0 implementation of BRX System.
