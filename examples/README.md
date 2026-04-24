# BRX System Examples

This directory contains practical examples for using the BRX System platform.

## Available Examples

### 1. Basic Chat Application
See `chat-example/` for a complete chat implementation.

### 2. Code Generation Workflow
See `code-generation/` for automated code generation pipelines.

### 3. Story Creation Pipeline
See `story-creation/` for end-to-end story generation.

### 4. Agent Configuration
See `agent-configs/` for pre-configured agent templates.

### 5. RAG Implementation
See `rag-example/` for knowledge base and RAG setup.

### 6. Training Pipeline
See `training-pipeline/` for model fine-tuning examples.

## Quick Start Examples

### Chat with AI Model

```typescript
import { trpc } from "@/providers/trpc";

function ChatExample() {
  const sendMessage = trpc.ai.sendMessage.useMutation();

  const handleSend = async (content: string) => {
    await sendMessage.mutateAsync({
      conversationId: 1,
      content,
    });
  };

  return <button onClick={() => handleSend("Hello")}>Send</button>;
}
```

### Generate Code

```typescript
const generateCode = trpc.code.generate.useMutation();

const result = await generateCode.mutateAsync({
  description: "Create a function to sort an array of objects by date",
  language: "typescript",
  type: "function",
});

console.log(result.code);
console.log(result.explanation);
```

### Create Story

```typescript
const createStory = trpc.story.create.useMutation();
const generateOutline = trpc.story.generateOutline.useMutation();

// Step 1: Create story project
const story = await createStory.mutateAsync({
  title: "The Quantum Thief",
  genre: "sci_fi",
  tone: "suspenseful",
  targetAudience: "adult",
  premise: "A master thief steals quantum technology from a dystopian future corporation.",
  setting: "Neo-Tokyo, 2157. A city divided between the ultra-rich upper levels and the crime-ridden undercity.",
  targetWordCount: 15000,
  chapterCount: 8,
});

// Step 2: Generate outline
const outline = await generateOutline.mutateAsync({ id: story.id });
console.log(outline.characters);
console.log(outline.chapters);
```

### Create Agent

```typescript
const createAgent = trpc.agent.create.useMutation();

const agent = await createAgent.mutateAsync({
  name: "Code Reviewer",
  description: "Expert code reviewer with security focus",
  systemPrompt: `You are an expert code reviewer specializing in security and performance. 
Analyze code for vulnerabilities, inefficiencies, and best practice violations. 
Provide specific, actionable recommendations.`,
  modelId: "claude-3-5-sonnet-20241022",
  temperature: 0.3,
  tools: [
    {
      type: "function",
      function: {
        name: "security_scan",
        description: "Scan code for security vulnerabilities",
      },
    },
  ],
});
```

### Setup Knowledge Base

```typescript
const createBase = trpc.knowledge.createBase.useMutation();
const addDocument = trpc.knowledge.addDocument.useMutation();
const queryRag = trpc.knowledge.queryRag.useQuery();

// Create knowledge base
const kb = await createBase.mutateAsync({
  name: "Product Documentation",
  description: "All product documentation and FAQs",
  embeddingModel: "nomic-embed-text",
  vectorStore: "chromadb",
  chunkSize: 512,
  chunkOverlap: 50,
});

// Add documents
await addDocument.mutateAsync({
  knowledgeBaseId: kb.id,
  name: "Getting Started Guide",
  content: "...",
  mimeType: "text/markdown",
});

// Query
const results = await queryRag({
  knowledgeBaseId: kb.id,
  query: "How do I install the product?",
  topK: 5,
});
```

### Create Workflow

```typescript
const createWorkflow = trpc.workflow.create.useMutation();

const workflow = await createWorkflow.mutateAsync({
  name: "Content Generation Pipeline",
  description: "Generate blog posts from topic ideas",
  nodes: [
    { id: "1", type: "trigger", label: "Topic Input" },
    { id: "2", type: "llm", label: "Research", model: "gpt-4o" },
    { id: "3", type: "llm", label: "Write", model: "claude-3-5-sonnet" },
    { id: "4", type: "output", label: "Published Post" },
  ],
  edges: [
    { from: "1", to: "2" },
    { from: "2", to: "3" },
    { from: "3", to: "4" },
  ],
  triggerType: "manual",
});
```

### Training Job

```typescript
const createJob = trpc.training.createJob.useMutation();

const job = await createJob.mutateAsync({
  name: "Llama-3B Fine-tune",
  description: "Fine-tune for customer support responses",
  baseModel: "meta-llama/Llama-2-7b-hf",
  trainingType: "lora",
  datasetId: 1,
  hyperparameters: {
    learningRate: 2e-4,
    batchSize: 4,
    epochs: 3,
    loraR: 16,
    loraAlpha: 32,
  },
  gpuType: "A100",
  gpuCount: 1,
});
```

## API Integration Examples

### Python Client

```python
import requests

BASE_URL = "http://localhost:3000/api/trpc"

# List models
response = requests.get(f"{BASE_URL}/ai.modelList")
models = response.json()

# Send message
response = requests.post(
    f"{BASE_URL}/ai.sendMessage",
    json={
        "conversationId": 1,
        "content": "Hello!",
    },
)
message = response.json()
```

### cURL Examples

```bash
# List models
curl http://localhost:3000/api/trpc/ai.modelList

# Create conversation
curl -X POST http://localhost:3000/api/trpc/ai.createConversation \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Chat", "modelId": "gpt-4o"}'

# Generate code
curl -X POST http://localhost:3000/api/trpc/code.generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Sort array function",
    "language": "typescript",
    "type": "function"
  }'

# Create story
curl -X POST http://localhost:3000/api/trpc/story.create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Adventure Story",
    "genre": "adventure",
    "tone": "epic",
    "targetAudience": "young_adult"
  }'
```

## WebSocket Examples

### Real-time Chat

```typescript
const ws = new WebSocket("ws://localhost:3000/ws");

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: "subscribe",
    channel: "chat:123",
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("New message:", data);
};

// Send message
ws.send(JSON.stringify({
  type: "message",
  content: "Hello!",
}));
```

## Advanced Examples

### Custom AI Provider

```typescript
// Register custom provider
import { aiEngine } from "@/api/engine/ai-engine";

class CustomProvider {
  name = "Custom AI";
  id = "custom";
  supportsStreaming = true;
  supportsTools = false;
  supportsVision = false;
  supportsJSON = true;
  models = ["custom-model-v1"];

  async generate(request, config) {
    const response = await fetch(config.baseUrl + "/generate", {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}` },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async generateStream(request, config, onChunk) {
    // Implementation
  }
}

aiEngine.registerProvider(new CustomProvider());
```

### Batch Processing

```typescript
// Process multiple items
const items = ["item1", "item2", "item3"];

const results = await Promise.all(
  items.map(async (item) => {
    return trpc.ai.generate.mutateAsync({
      type: "text",
      prompt: `Process: ${item}`,
    });
  })
);
```

### Error Handling

```typescript
const mutation = trpc.ai.generate.useMutation({
  onError: (error) => {
    console.error("Generation failed:", error.message);
    toast.error(error.message);
  },
  onSuccess: (data) => {
    console.log("Generated:", data);
    toast.success("Generation complete!");
  },
  retry: 3,
});
```

## Performance Tips

1. Use React Query caching effectively
2. Implement pagination for large lists
3. Use streaming for real-time features
4. Debounce search inputs
5. Optimize images and assets
6. Use connection pooling for database

## Security Best Practices

1. Never expose API keys in frontend
2. Validate all user inputs
3. Use parameterized queries
4. Implement rate limiting
5. Sanitize file uploads
6. Use HTTPS in production

---

For more examples, visit the documentation or GitHub repository.
