# API Reference

## Authentication

All API endpoints except `ping` and `auth` require a valid session cookie obtained through OAuth login.

## Base URL

```
/api/trpc/{router}.{procedure}
```

## Routers

### Ping
**Procedure**: `ping`
**Access**: Public
**Response**: `{ ok: true, ts: number }`

### Auth
**Procedures**: Login/logout via OAuth flow. Managed by Kimi SDK.

### AI (ai.)

#### modelList
- **Type**: Query
- **Auth**: Public
- **Returns**: Array of active AI models

#### modelSearch
- **Type**: Query
- **Auth**: Public
- **Input**: `{ query: string, category?: string }`
- **Returns**: Filtered model array

#### modelById
- **Type**: Query
- **Auth**: Public
- **Input**: `{ id: number }`

#### createModel
- **Type**: Mutation
- **Auth**: Admin
- **Input**: Full model definition

#### conversationList
- **Type**: Query
- **Auth**: User
- **Input**: `{ archived?: boolean }`

#### conversationById
- **Type**: Query
- **Auth**: User
- **Input**: `{ id: number }`
- **Returns**: Conversation with messages

#### createConversation
- **Type**: Mutation
- **Auth**: User
- **Input**: `{ title, modelId, systemPrompt?, temperature?, maxTokens? }`

#### sendMessage
- **Type**: Mutation
- **Auth**: User
- **Input**: `{ conversationId, content, role }`

#### generate
- **Type**: Mutation
- **Auth**: User
- **Input**: `{ type, prompt, modelId, parameters? }`
- **Returns**: `{ taskId, result }`

### Agent (agent.)

#### list / publicList
- **Type**: Query
- **Auth**: User

#### create
- **Type**: Mutation
- **Auth**: User
- **Input**: `{ name, description?, systemPrompt, modelId, temperature?, maxTokens?, tools?, memoryEnabled?, knowledgeBaseIds?, isPublic? }`

#### run
- **Type**: Mutation
- **Auth**: User
- **Input**: `{ id, input, context? }`
- **Returns**: `{ response, agentId }`

### Knowledge (knowledge.)

#### listBases / baseById
- **Type**: Query
- **Auth**: User

#### createBase
- **Type**: Mutation
- **Auth**: User
- **Input**: `{ name, description?, embeddingModel?, vectorStore?, chunkSize?, chunkOverlap?, isPublic? }`

#### addDocument
- **Type**: Mutation
- **Auth**: User
- **Input**: `{ knowledgeBaseId, name, source?, content, mimeType?, size? }`

#### queryRag
- **Type**: Mutation
- **Auth**: User
- **Input**: `{ knowledgeBaseId, query, topK? }`
- **Returns**: `{ results, context, response }`

### Workflow (workflow.)

#### list / publicList / byId
- **Type**: Query
- **Auth**: User

#### create
- **Type**: Mutation
- **Auth**: User
- **Input**: `{ name, description?, nodes?, edges?, triggerType?, cronExpression?, isPublic? }`

#### run
- **Type**: Mutation
- **Auth**: User
- **Input**: `{ id, inputData? }`
- **Returns**: `{ response, workflowId }`

### Integration (integration.)

#### list / byId
- **Type**: Query
- **Auth**: User

#### create
- **Type**: Mutation
- **Auth**: User
- **Input**: `{ name, type, endpoint?, apiKey?, config? }`

#### testConnection
- **Type**: Mutation
- **Auth**: User
- **Input**: `{ id }`
- **Returns**: `{ success, type, endpoint }`

### MCP (mcp.)

#### list
- **Type**: Query
- **Auth**: User

#### create
- **Type**: Mutation
- **Auth**: User
- **Input**: `{ name, transport, command?, args?, env?, url?, tools? }`

## Error Handling

All errors return tRPC error objects with:
- `code`: HTTP-like status code
- `message`: Human-readable description

Common codes:
- `UNAUTHORIZED` - Missing or invalid session
- `FORBIDDEN` - Insufficient permissions
- `BAD_REQUEST` - Invalid input data
- `NOT_FOUND` - Resource does not exist
- `INTERNAL_SERVER_ERROR` - Unexpected server error

## Rate Limiting

API rate limits are enforced per user session. Contact administrator for limit adjustments.

## Versioning

Current API version: v2.0
Version identifier included in all responses via `ts` field.
