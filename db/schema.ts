import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  boolean,
  json,
  int,
  float,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  agents: many(agents),
  workflows: many(workflows),
  knowledgeBases: many(knowledgeBases),
}));

export const aiModels = mysqlTable("ai_models", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 100 }).notNull(),
  modelId: varchar("modelId", { length: 255 }).notNull().unique(),
  description: text("description"),
  category: mysqlEnum("category", [
    "llm",
    "vision",
    "audio",
    "multimodal",
    "embedding",
    "code",
    "agent",
  ]).default("llm").notNull(),
  architecture: varchar("architecture", { length: 255 }),
  parameters: varchar("parameters", { length: 50 }),
  quantization: varchar("quantization", { length: 50 }),
  contextWindow: int("contextWindow").default(4096),
  license: varchar("license", { length: 100 }),
  sourceUrl: text("sourceUrl"),
  isLocal: boolean("isLocal").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  tags: json("tags"),
  capabilities: json("capabilities"),
  config: json("config"),
  downloads: int("downloads").default(0),
  rating: float("rating").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const conversations = mysqlTable("conversations", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  modelId: varchar("modelId", { length: 255 }).notNull(),
  systemPrompt: text("systemPrompt"),
  temperature: float("temperature").default(0.7),
  maxTokens: int("maxTokens").default(2048),
  metadata: json("metadata"),
  isArchived: boolean("isArchived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, { fields: [conversations.userId], references: [users.id] }),
  messages: many(messages),
}));

export const messages = mysqlTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: bigint("conversationId", { mode: "number", unsigned: true }).notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system", "tool"]).notNull(),
  content: text("content").notNull(),
  toolCalls: json("toolCalls"),
  toolResults: json("toolResults"),
  modelUsed: varchar("modelUsed", { length: 255 }),
  tokensUsed: int("tokensUsed"),
  latency: int("latency"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
}));

export const agents = mysqlTable("agents", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  avatar: text("avatar"),
  systemPrompt: text("systemPrompt").notNull(),
  modelId: varchar("modelId", { length: 255 }).notNull(),
  temperature: float("temperature").default(0.7),
  maxTokens: int("maxTokens").default(2048),
  tools: json("tools"),
  memoryEnabled: boolean("memoryEnabled").default(true).notNull(),
  memoryWindow: int("memoryWindow").default(10),
  knowledgeBaseIds: json("knowledgeBaseIds"),
  isPublic: boolean("isPublic").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  runCount: int("runCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const agentsRelations = relations(agents, ({ one }) => ({
  user: one(users, { fields: [agents.userId], references: [users.id] }),
}));

export const knowledgeBases = mysqlTable("knowledge_bases", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  embeddingModel: varchar("embeddingModel", { length: 255 }).default("nomic-embed-text"),
  vectorStore: mysqlEnum("vectorStore", ["chromadb", "qdrant", "weaviate", "milvus", "pgvector"]).default("chromadb").notNull(),
  chunkSize: int("chunkSize").default(512),
  chunkOverlap: int("chunkOverlap").default(50),
  documentCount: int("documentCount").default(0),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const knowledgeBasesRelations = relations(knowledgeBases, ({ one, many }) => ({
  user: one(users, { fields: [knowledgeBases.userId], references: [users.id] }),
  documents: many(documents),
}));

export const documents = mysqlTable("documents", {
  id: serial("id").primaryKey(),
  knowledgeBaseId: bigint("knowledgeBaseId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 500 }),
  content: text("content"),
  mimeType: varchar("mimeType", { length: 100 }),
  size: int("size"),
  chunkCount: int("chunkCount").default(0),
  status: mysqlEnum("status", ["pending", "processing", "indexed", "error"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  knowledgeBase: one(knowledgeBases, { fields: [documents.knowledgeBaseId], references: [knowledgeBases.id] }),
}));

export const workflows = mysqlTable("workflows", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  nodes: json("nodes").notNull(),
  edges: json("edges").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  triggerType: mysqlEnum("triggerType", ["manual", "scheduled", "webhook", "event"]).default("manual").notNull(),
  cronExpression: varchar("cronExpression", { length: 100 }),
  runCount: int("runCount").default(0),
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const workflowsRelations = relations(workflows, ({ one }) => ({
  user: one(users, { fields: [workflows.userId], references: [users.id] }),
}));

export const integrations = mysqlTable("integrations", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "ollama",
    "openai",
    "anthropic",
    "google",
    "huggingface",
    "local",
    "mcp",
    "custom",
  ]).notNull(),
  endpoint: varchar("endpoint", { length: 500 }),
  apiKey: varchar("apiKey", { length: 500 }),
  config: json("config"),
  isActive: boolean("isActive").default(true).notNull(),
  lastTestedAt: timestamp("lastTestedAt"),
  status: mysqlEnum("status", ["connected", "disconnected", "error"]).default("disconnected").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const mcpServers = mysqlTable("mcp_servers", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  transport: mysqlEnum("transport", ["stdio", "sse", "http"]).default("stdio").notNull(),
  command: varchar("command", { length: 500 }),
  args: json("args"),
  env: json("env"),
  url: varchar("url", { length: 500 }),
  tools: json("tools"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const generationTasks = mysqlTable("generation_tasks", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", [
    "text",
    "image",
    "audio",
    "video",
    "embedding",
    "code",
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  prompt: text("prompt").notNull(),
  modelId: varchar("modelId", { length: 255 }).notNull(),
  parameters: json("parameters"),
  result: text("result"),
  resultUrl: text("resultUrl"),
  errorMessage: text("errorMessage"),
  tokensUsed: int("tokensUsed"),
  duration: int("duration"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type AiModel = typeof aiModels.$inferSelect;
export type InsertAiModel = typeof aiModels.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;
export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBases.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;
export type McpServer = typeof mcpServers.$inferSelect;
export type InsertMcpServer = typeof mcpServers.$inferInsert;
export type GenerationTask = typeof generationTasks.$inferSelect;
export type InsertGenerationTask = typeof generationTasks.$inferInsert;
