# BRX System API Reference

## Overview

BRX System provides a comprehensive tRPC-based API with end-to-end type safety. All endpoints are accessible through the `/api/trpc` path.

## Authentication

All authenticated endpoints require a valid session cookie. Authentication is handled through OAuth 2.0.

### Public Endpoints
- `ping` - Health check
- `auth.me` - Get current user
- `auth.logout` - Clear session
- `catalog.list` - List catalog items
- `catalog.listFeatured` - List featured items
- `catalog.byCategory` - Filter by category
- `catalog.byId` - Get item by ID
- `catalog.search` - Search catalog

### Authentication Required
All other endpoints require authentication.

## Router: AI (`ai.`)

### Model Management

#### `ai.modelList`
Returns a list of all active AI models.

**Input:** None

**Returns:**
```typescript
Array<{
  id: number;
  name: string;
  provider: string;
  modelId: string;
  description: string | null;
  category: string;
  architecture: string | null;
  parameters: string | null;
  contextWindow: number | null;
  license: string | null;
  sourceUrl: string | null;
  isLocal: boolean;
  isActive: boolean;
  tags: string[] | null;
  capabilities: any;
}>
```

#### `ai.modelSearch`
Search models by query and category.

**Input:**
```typescript
{
  query?: string;
  category?: string;
  provider?: string;
}
```

#### `ai.modelById`
Get model details by ID.

**Input:** `{ id: number }`

#### `ai.createModel`
Create a new model entry.

**Input:**
```typescript
{
  name: string;
  provider: string;
  modelId: string;
  description?: string;
  category?: string;
  architecture?: string;
  parameters?: string;
  contextWindow?: number;
  license?: string;
  sourceUrl?: string;
  isLocal?: boolean;
  tags?: string[];
}
```

#### `ai.updateModel`
Update an existing model.

**Input:** `{ id: number, ...modelFields }`

#### `ai.deleteModel`
Delete a model entry.

**Input:** `{ id: number }`

#### `ai.seedModels`
Seed the database with default open-source models.

**Input:** None

**Returns:** `{ count: number }`

### Conversation Management

#### `ai.conversationList`
List conversations for the current user.

**Input:** `{ archived?: boolean }`

**Returns:** Array of conversations with metadata.

#### `ai.conversationById`
Get a specific conversation.

**Input:** `{ id: number }`

#### `ai.createConversation`
Create a new conversation.

**Input:**
```typescript
{
  title: string;
  modelId: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}
```

#### `ai.updateConversation`
Update conversation settings.

**Input:** `{ id: number, ...fields }`

#### `ai.deleteConversation`
Delete a conversation.

**Input:** `{ id: number }`

### Messaging

#### `ai.sendMessage`
Send a message in a conversation.

**Input:**
```typescript
{
  conversationId: number;
  content: string;
  role?: "user" | "assistant";
}
```

#### `ai.generate`
Run an async generation task.

**Input:**
```typescript
{
  type: "text" | "image" | "audio" | "video" | "code" | "story";
  prompt: string;
  modelId?: string;
  parameters?: Record<string, any>;
}
```

**Returns:** `{ taskId: number }`

#### `ai.generationStatus`
Check generation task status.

**Input:** `{ taskId: number }`

#### `ai.generationHistory`
Get generation history for the user.

**Input:** `{ type?: string, limit?: number }`

## Router: Agent (`agent.`)

### Agent Management

#### `agent.list`
List agents for the current user.

**Input:** None

#### `agent.publicList`
List public agents.

**Input:** None

#### `agent.byId`
Get agent details.

**Input:** `{ id: number }`

#### `agent.create`
Create a new agent.

**Input:**
```typescript
{
  name: string;
  description?: string;
  systemPrompt: string;
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  tools?: any[];
  memoryEnabled?: boolean;
  memoryWindow?: number;
  isPublic?: boolean;
}
```

#### `agent.update`
Update agent configuration.

**Input:** `{ id: number, ...fields }`

#### `agent.delete`
Delete an agent.

**Input:** `{ id: number }`

### Agent Execution

#### `agent.run`
Execute an agent with input.

**Input:**
```typescript
{
  id: number;
  input: string;
  context?: string;
  stream?: boolean;
}
```

**Returns:** `{ response: string; toolCalls?: any[]; latency: number }`

## Router: Knowledge (`knowledge.`)

### Knowledge Base Management

#### `knowledge.listBases`
List knowledge bases for the current user.

**Input:** None

#### `knowledge.baseById`
Get knowledge base details.

**Input:** `{ id: number }`

#### `knowledge.createBase`
Create a new knowledge base.

**Input:**
```typescript
{
  name: string;
  description?: string;
  embeddingModel?: string;
  vectorStore?: "chromadb" | "qdrant" | "weaviate" | "milvus" | "pgvector";
  chunkSize?: number;
  chunkOverlap?: number;
}
```

#### `knowledge.updateBase`
Update knowledge base settings.

**Input:** `{ id: number, ...fields }`

#### `knowledge.deleteBase`
Delete a knowledge base.

**Input:** `{ id: number }`

### Document Management

#### `knowledge.addDocument`
Add a document to a knowledge base.

**Input:**
```typescript
{
  knowledgeBaseId: number;
  name: string;
  content: string;
  source?: string;
  mimeType?: string;
}
```

#### `knowledge.deleteDocument`
Remove a document.

**Input:** `{ id: number }`

### RAG Query

#### `knowledge.queryRag`
Perform RAG semantic search.

**Input:**
```typescript
{
  knowledgeBaseId: number;
  query: string;
  topK?: number;
  filter?: Record<string, any>;
}
```

**Returns:** Array of relevant chunks with scores.

## Router: Workflow (`workflow.`)

### Workflow Management

#### `workflow.list`
List workflows for the current user.

**Input:** None

#### `workflow.publicList`
List public workflows.

**Input:** None

#### `workflow.byId`
Get workflow details.

**Input:** `{ id: number }`

#### `workflow.create`
Create a new workflow.

**Input:**
```typescript
{
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggerType?: "manual" | "scheduled" | "webhook" | "event";
  cronExpression?: string;
}
```

#### `workflow.update`
Update workflow definition.

**Input:** `{ id: number, ...fields }`

#### `workflow.delete`
Delete a workflow.

**Input:** `{ id: number }`

### Workflow Execution

#### `workflow.run`
Execute a workflow.

**Input:**
```typescript
{
  id: number;
  input?: Record<string, any>;
}
```

**Returns:** `{ executionId: number; status: string; output?: any }`

## Router: Story (`story.`)

### Story Management

#### `story.list`
List stories for the current user.

**Input:** None

#### `story.byId`
Get story details.

**Input:** `{ id: number }`

#### `story.create`
Create a new story project.

**Input:**
```typescript
{
  title: string;
  genre: string;
  tone: string;
  targetAudience: string;
  premise?: string;
  setting?: string;
  targetWordCount?: number;
  chapterCount?: number;
  language?: string;
  modelId?: string;
}
```

#### `story.update`
Update story metadata.

**Input:** `{ id: number, ...fields }`

#### `story.delete`
Delete a story.

**Input:** `{ id: number }`

### Story Generation

#### `story.generateOutline`
Generate story outline with characters and chapters.

**Input:** `{ id: number }`

**Returns:** `StoryOutline` object

#### `story.generateChapter`
Generate a specific chapter.

**Input:** `{ id: number; chapterNumber: number }`

**Returns:** Generated chapter with content.

#### `story.generateFullStory`
Generate the complete story.

**Input:** `{ id: number }`

**Returns:** `StoryGenerationResult`

#### `story.listPublic`
List public stories.

**Input:** None

## Router: Code (`code.`)

### Code Generation

#### `code.generate`
Generate code from description.

**Input:**
```typescript
{
  description: string;
  language: string;
  framework?: string;
  type?: "function" | "class" | "component" | "api" | "script" | "test" | "full_app";
  context?: string;
  requirements?: string[];
}
```

**Returns:** `{ code: string; language: string; explanation: string; dependencies?: string[] }`

#### `code.analyze`
Analyze code for review, explanation, or optimization.

**Input:**
```typescript
{
  code: string;
  language: string;
  analysisType: "review" | "explain" | "optimize" | "debug" | "document" | "refactor" | "security";
  context?: string;
}
```

**Returns:** Analysis result (varies by type)

#### `code.fix`
Fix code based on error message.

**Input:** `{ code: string; error: string; language: string }`

**Returns:** `{ code: string }`

#### `code.generateTests`
Generate unit tests for code.

**Input:** `{ code: string; language: string; framework?: string }`

**Returns:** `{ code: string }`

#### `code.refactor`
Refactor code based on instructions.

**Input:** `{ code: string; instruction: string; language: string }`

**Returns:** `{ code: string; explanation: string }`

#### `code.convert`
Convert code between languages.

**Input:** `{ code: string; fromLang: string; toLang: string }`

**Returns:** `{ code: string }`

#### `code.document`
Generate documentation for code.

**Input:** `{ code: string; language: string }`

**Returns:** `{ documentation: string }`

#### `code.generateProject`
Generate a complete project structure.

**Input:**
```typescript
{
  name: string;
  description: string;
  type: string;
  language: string;
  framework?: string;
  features?: string[];
}
```

**Returns:** `ProjectStructure` with files, setup instructions, dependencies.

### Project Management

#### `code.listProjects`
List code projects for the current user.

**Input:** None

#### `code.getProject`
Get project details.

**Input:** `{ id: number }`

#### `code.createProject`
Create a new code project.

**Input:** `{ name: string; description?: string; language: string; framework?: string; type?: string }`

#### `code.updateProject`
Update project.

**Input:** `{ id: number, ...fields }`

#### `code.deleteProject`
Delete project.

**Input:** `{ id: number }`

#### `code.listLanguages`
List supported programming languages.

**Input:** None

## Router: Training (`training.`)

### Training Job Management

#### `training.listJobs`
List training jobs for the current user.

**Input:** None

#### `training.getJob`
Get job details.

**Input:** `{ id: number }`

#### `training.createJob`
Create a new training job.

**Input:**
```typescript
{
  name: string;
  description?: string;
  baseModel: string;
  trainingType: "fine_tuning" | "rlhf" | "dpo" | "distillation" | "grpo" | "sft" | "lora" | "qlora";
  datasetId?: number;
  hyperparameters?: Record<string, any>;
  gpuType?: string;
  gpuCount?: number;
}
```

#### `training.updateJob`
Update job status and metrics.

**Input:** `{ id: number, ...fields }`

#### `training.cancelJob`
Cancel a running job.

**Input:** `{ id: number }`

#### `training.deleteJob`
Delete a job.

**Input:** `{ id: number }`

### Dataset Management

#### `training.listDatasets`
List datasets.

**Input:** None

#### `training.getDataset`
Get dataset details.

**Input:** `{ id: number }`

#### `training.createDataset`
Create a new dataset entry.

**Input:**
```typescript
{
  name: string;
  description?: string;
  type: string;
  format?: string;
  source?: string;
  recordCount?: number;
}
```

#### `training.updateDataset`
Update dataset.

**Input:** `{ id: number, ...fields }`

#### `training.deleteDataset`
Delete dataset.

**Input:** `{ id: number }`

## Router: Catalog (`catalog.`)

### Catalog Operations

#### `catalog.list`
List all catalog items.

**Input:** None

**Returns:** Array of open source projects

#### `catalog.listFeatured`
List featured projects.

**Input:** None

#### `catalog.byCategory`
Filter by category.

**Input:** `{ category: string }`

#### `catalog.byId`
Get item by ID.

**Input:** `{ id: number }`

#### `catalog.search`
Search catalog.

**Input:** `{ query: string }`

#### `catalog.create`
Add new catalog item.

**Input:** Project details

#### `catalog.seedCatalog`
Seed with default catalog items.

**Input:** None

**Returns:** `{ count: number }`

## Router: Integration (`integration.`)

### Integration Management

#### `integration.list`
List integrations for the current user.

**Input:** None

#### `integration.byId`
Get integration details.

**Input:** `{ id: number }`

#### `integration.create`
Create a new integration.

**Input:**
```typescript
{
  name: string;
  type: string;
  endpoint?: string;
  apiKey?: string;
  config?: Record<string, any>;
}
```

#### `integration.update`
Update integration.

**Input:** `{ id: number, ...fields }`

#### `integration.delete`
Delete integration.

**Input:** `{ id: number }`

#### `integration.testConnection`
Test integration connectivity.

**Input:** `{ id: number }`

## Router: MCP (`mcp.`)

### MCP Server Management

#### `mcp.list`
List MCP servers.

**Input:** None

#### `mcp.create`
Create MCP server configuration.

**Input:** `{ name: string; transport: string; command?: string; url?: string }`

#### `mcp.update`
Update MCP server.

**Input:** `{ id: number, ...fields }`

#### `mcp.delete`
Delete MCP server.

**Input:** `{ id: number }`

## Error Handling

All endpoints return standard tRPC errors:

```typescript
{
  code: "BAD_REQUEST" | "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR";
  message: string;
  cause?: unknown;
}
```

## Rate Limiting

API endpoints are rate-limited based on user tier:
- Free: 60 requests/minute
- Pro: 300 requests/minute
- Enterprise: Custom limits

## WebSocket Support

Real-time features use WebSocket connections:
- Chat streaming
- Agent execution
- Workflow monitoring
- Training progress

## Examples

### Sending a Chat Message

```typescript
const utils = trpc.useUtils();
const sendMessage = trpc.ai.sendMessage.useMutation({
  onSuccess: () => utils.ai.conversationList.invalidate(),
});

sendMessage.mutate({
  conversationId: 1,
  content: "Hello, how are you?",
});
```

### Generating Code

```typescript
const generateCode = trpc.code.generate.useMutation();

const result = await generateCode.mutateAsync({
  description: "Create a React button component with loading state",
  language: "typescript",
  framework: "react",
  type: "component",
});

console.log(result.code);
```

### Creating a Story

```typescript
const createStory = trpc.story.create.useMutation();
const generateOutline = trpc.story.generateOutline.useMutation();

const story = await createStory.mutateAsync({
  title: "The Lost Kingdom",
  genre: "fantasy",
  tone: "epic",
  targetAudience: "adult",
  premise: "A young warrior discovers an ancient kingdom hidden in the mountains.",
});

await generateOutline.mutateAsync({ id: story.id });
```

---

For more information, visit the GitHub repository or contact the development team.
