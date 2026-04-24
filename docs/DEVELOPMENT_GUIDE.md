# BRX System Development Guide

## Table of Contents
1. [Project Setup](#project-setup)
2. [Architecture Overview](#architecture-overview)
3. [Backend Development](#backend-development)
4. [Frontend Development](#frontend-development)
5. [Database Operations](#database-operations)
6. [AI Provider Integration](#ai-provider-integration)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Contributing](#contributing)

## Project Setup

### Development Environment Requirements

| Component | Minimum Version | Recommended |
|-----------|----------------|-------------|
| Node.js | 20.0.0 | 22.0.0 |
| MySQL | 8.0.0 | 8.4.0 |
| npm | 10.0.0 | 10.8.0 |
| Git | 2.40.0 | 2.45.0 |

### IDE Configuration

Recommended VS Code extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer
- tRPC Snippets

### Local Development Setup

```bash
# 1. Clone and install
git clone https://github.com/DragonBRX/BRX-SYSTEM.git
cd BRX-SYSTEM
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 3. Start MySQL (using Docker)
docker run -d \
  --name brx-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=brx_system \
  -p 3306:3306 \
  mysql:8.4

# 4. Push database schema
npm run db:push

# 5. Seed data
npm run db:seed

# 6. Start dev server
npm run dev
```

## Architecture Overview

### System Architecture

```
+------------------+     +------------------+     +------------------+
|     Client       |     |     Server       |     |   External APIs  |
| (React + Vite)   |<--->| (Hono + tRPC)    |<--->| (OpenAI, etc.)   |
+------------------+     +------------------+     +------------------+
        |                        |
        |                        v
        |               +------------------+
        |               |   MySQL Database |
        |               +------------------+
        v
+------------------+
|  Local Storage   |
| (Cache, State)   |
+------------------+
```

### Request Flow

1. Client sends tRPC request
2. Hono server receives request
3. tRPC router processes request
4. Middleware checks authentication
5. Database query executed via Drizzle ORM
6. Response returned to client

### Data Flow

```
User Action -> React Component -> tRPC Hook -> API Router -> Drizzle ORM -> MySQL
                                                    |
                                              AI Provider
                                                    |
                                              Response -> React Query Cache -> UI Update
```

## Backend Development

### Creating a New Router

```typescript
// api/my-router.ts
import { z } from "zod";
import { createRouter, authedQuery, authedMutation } from "./middleware";
import { db } from "./queries/connection";
import { myTable } from "../db/schema";
import { eq } from "drizzle-orm";

export const myRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    return db.select().from(myTable).where(eq(myTable.userId, ctx.user.id));
  }),

  create: authedMutation
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.insert(myTable).values({
        userId: ctx.user.id,
        name: input.name,
      });
      return { id: Number(result[0].insertId) };
    }),
});
```

### Registering the Router

```typescript
// api/router.ts
import { myRouter } from "./my-router";

export const appRouter = createRouter({
  // ... existing routers
  my: myRouter,
});
```

### Adding a New AI Provider

```typescript
// api/providers/my-provider.ts
import type { AIProvider, AIRequest, AIResponse, ProviderConfig } from "../engine/ai-engine";

export class MyProvider implements AIProvider {
  name = "My Provider";
  id = "myprovider";
  supportsStreaming = true;
  supportsTools = true;
  supportsVision = false;
  supportsJSON = true;
  models = ["model-1", "model-2"];

  async generate(request: AIRequest, config: ProviderConfig): Promise<AIResponse> {
    // Implementation
  }

  async generateStream(
    request: AIRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    // Implementation
  }
}
```

### Database Schema Changes

```typescript
// db/schema.ts
export const myNewTable = mysqlTable("my_new_table", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  config: json("config"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

After schema changes:
```bash
npm run db:generate
npm run db:migrate
```

## Frontend Development

### Creating a New Page

```typescript
// src/pages/MyPage.tsx
import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/providers/trpc";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MyPage() {
  const { data, isLoading } = trpc.my.list.useQuery();

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Page</h1>
        {data?.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
```

### Adding a Route

```typescript
// src/App.tsx
import MyPage from "./pages/MyPage";

<Route path="/my-page" element={<MyPage />} />
```

### Using tRPC Hooks

```typescript
// Query
const { data, isLoading, error } = trpc.ai.modelList.useQuery();

// Mutation
const createModel = trpc.ai.createModel.useMutation({
  onSuccess: () => {
    // Invalidate cache
    utils.ai.modelList.invalidate();
  },
});

// Create
createModel.mutate({ name: "GPT-4", provider: "openai", modelId: "gpt-4" });
```

### Component Patterns

```typescript
// Loading state
if (isLoading) return <Skeleton className="h-20" />;

// Error state
if (error) return <Alert variant="destructive">{error.message}</Alert>;

// Empty state
if (!data?.length) return <EmptyState />;

// Data display
return <DataTable data={data} />;
```

## Database Operations

### Common Queries

```typescript
// Select all
const results = await db.select().from(users);

// Select with where
const user = await db.select().from(users).where(eq(users.id, 1)).limit(1);

// Select with relations
const usersWithConversations = await db.query.users.findMany({
  with: { conversations: true },
});

// Insert
const result = await db.insert(users).values({ name: "John", email: "john@example.com" });

// Update
await db.update(users).set({ name: "Jane" }).where(eq(users.id, 1));

// Delete
await db.delete(users).where(eq(users.id, 1));

// Count
const count = await db.select({ count: sql<number>`count(*)` }).from(users);
```

### Migrations

```bash
# Generate migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema (dev only)
npm run db:push

# Studio
npx drizzle-kit studio
```

## AI Provider Integration

### Supported Providers

| Provider | Models | Streaming | Tools | Vision |
|----------|--------|-----------|-------|--------|
| OpenAI | GPT-4o, o1, o3 | Yes | Yes | Yes |
| Anthropic | Claude 3.5, Opus | Yes | Yes | Yes |
| Google | Gemini 2.0, 1.5 | Yes | Yes | Yes |
| DeepSeek | DeepSeek-V3, R1 | Yes | Yes | No |
| Ollama | Llama, Mistral, etc. | Yes | Yes | Yes |

### Provider Configuration

Environment variables:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
DEEPSEEK_API_KEY=...
OLLAMA_BASE_URL=http://localhost:11434
```

### Request Format

```typescript
const request: AIRequest = {
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello!" },
  ],
  model: "gpt-4o",
  temperature: 0.7,
  maxTokens: 2048,
  stream: true,
};

const response = await aiEngine.generate(request);
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run with watch
npm run test -- --watch

# Run specific file
npm run test -- src/components/Button.test.tsx
```

### Writing Tests

```typescript
// src/utils/helpers.test.ts
import { describe, it, expect } from "vitest";
import { formatDate } from "./helpers";

describe("formatDate", () => {
  it("formats date correctly", () => {
    const date = new Date("2024-01-01");
    expect(formatDate(date)).toBe("January 1, 2024");
  });
});
```

### API Testing

```typescript
// api/routers/ai.test.ts
import { describe, it, expect } from "vitest";
import { appRouter } from "../router";

describe("AI Router", () => {
  it("lists models", async () => {
    const caller = appRouter.createCaller({ user: testUser });
    const models = await caller.ai.modelList();
    expect(models).toBeDefined();
    expect(Array.isArray(models)).toBe(true);
  });
});
```

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t brx-system .

# Run container
docker run -d \
  --name brx-system \
  -p 3000:3000 \
  -e DATABASE_URL=mysql://... \
  -e OPENAI_API_KEY=... \
  brx-system
```

### Docker Compose

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://root:pass@mysql:3306/brx
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.4
    environment:
      MYSQL_ROOT_PASSWORD: pass
      MYSQL_DATABASE: brx
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | MySQL connection string |
| OPENAI_API_KEY | No | OpenAI API key |
| ANTHROPIC_API_KEY | No | Anthropic API key |
| GOOGLE_API_KEY | No | Google API key |
| DEEPSEEK_API_KEY | No | DeepSeek API key |
| OLLAMA_BASE_URL | No | Ollama endpoint |
| VITE_KIMI_AUTH_URL | Yes | OAuth provider URL |
| VITE_APP_ID | Yes | Application ID |
| NODE_ENV | No | Environment (development/production) |
| PORT | No | Server port (default: 3000) |

## Contributing

### Code Style

- Use TypeScript for all code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add tests for new features

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

Types: feat, fix, docs, style, refactor, test, chore

Example:
```
feat(ai): add streaming support for Anthropic provider

- Implement Server-Sent Events parsing
- Add reasoning content extraction
- Update types for new response format
```

### Pull Request Process

1. Create feature branch from main
2. Make changes with tests
3. Run lint and tests: `npm run lint && npm run test`
4. Push branch and create PR
5. Wait for review and approval
6. Merge to main

### Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests pass
- [ ] No console logs or debug code
- [ ] Error handling implemented
- [ ] Documentation updated
- [ ] Types are correct
- [ ] No security vulnerabilities

## Troubleshooting

### Common Issues

**Database connection failed**
```
Error: Can't connect to MySQL server
```
Solution: Check DATABASE_URL and ensure MySQL is running.

**Type errors after schema change**
```
Error: Type '...' is not assignable
```
Solution: Run `npm run db:generate` and restart TypeScript server.

**API key not working**
```
Error: 401 Unauthorized
```
Solution: Check environment variables and API key validity.

**Build fails**
```
Error: Cannot find module
```
Solution: Run `npm install` and `npm run check`.

### Debug Mode

```bash
# Enable debug logging
DEBUG=brx:* npm run dev

# Enable tRPC debug
DEBUG=trpc:* npm run dev
```

## Performance Optimization

### Frontend
- Use React Query for caching
- Implement virtual scrolling for long lists
- Lazy load pages with React.lazy
- Optimize images and assets

### Backend
- Use database connection pooling
- Implement request caching
- Use streaming for large responses
- Optimize database queries with indexes

### Database
- Add indexes on frequently queried columns
- Use pagination for large result sets
- Implement query caching
- Regular maintenance and optimization

## Security Best Practices

1. Never commit API keys to repository
2. Use environment variables for secrets
3. Validate all user input
4. Use parameterized queries (Drizzle handles this)
5. Implement rate limiting
6. Use HTTPS in production
7. Regular dependency updates
8. Audit npm packages before adding

---

For additional help, check the GitHub Issues or contact the development team.
