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
  longtext,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  preferences: json("preferences"),
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
  stories: many(stories),
  codeProjects: many(codeProjects),
  trainingJobs: many(trainingJobs),
  prompts: many(prompts),
  datasets: many(datasets),
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
    "reasoning",
    "mixture_of_experts",
  ]).default("llm").notNull(),
  architecture: varchar("architecture", { length: 255 }),
  parameters: varchar("parameters", { length: 50 }),
  quantization: varchar("quantization", { length: 50 }),
  contextWindow: int("contextWindow").default(4096),
  license: varchar("license", { length: 100 }),
  sourceUrl: text("sourceUrl"),
  huggingfaceUrl: text("huggingfaceUrl"),
  ollamaUrl: text("ollamaUrl"),
  isLocal: boolean("isLocal").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isRecommended: boolean("isRecommended").default(false).notNull(),
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
  topP: float("topP").default(0.9),
  frequencyPenalty: float("frequencyPenalty").default(0),
  presencePenalty: float("presencePenalty").default(0),
  metadata: json("metadata"),
  isArchived: boolean("isArchived").default(false).notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  folder: varchar("folder", { length: 100 }),
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
  content: longtext("content").notNull(),
  toolCalls: json("toolCalls"),
  toolResults: json("toolResults"),
  modelUsed: varchar("modelUsed", { length: 255 }),
  tokensUsed: int("tokensUsed"),
  tokensInput: int("tokensInput"),
  tokensOutput: int("tokensOutput"),
  latency: int("latency"),
  reasoning: longtext("reasoning"),
  citations: json("citations"),
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
  toolSchemas: json("toolSchemas"),
  memoryEnabled: boolean("memoryEnabled").default(true).notNull(),
  memoryWindow: int("memoryWindow").default(10),
  longTermMemory: boolean("longTermMemory").default(false).notNull(),
  knowledgeBaseIds: json("knowledgeBaseIds"),
  isPublic: boolean("isPublic").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  runCount: int("runCount").default(0),
  successRate: float("successRate").default(0),
  avgLatency: int("avgLatency").default(0),
  tags: json("tags"),
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
  chunkingStrategy: mysqlEnum("chunkingStrategy", ["fixed", "recursive", "semantic", "hierarchical"]).default("recursive").notNull(),
  documentCount: int("documentCount").default(0),
  totalChunks: int("totalChunks").default(0),
  isPublic: boolean("isPublic").default(false).notNull(),
  searchConfig: json("searchConfig"),
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
  content: longtext("content"),
  mimeType: varchar("mimeType", { length: 100 }),
  size: int("size"),
  chunkCount: int("chunkCount").default(0),
  status: mysqlEnum("status", ["pending", "processing", "indexed", "error"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  metadata: json("metadata"),
  indexedAt: timestamp("indexedAt"),
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
  variables: json("variables"),
  isActive: boolean("isActive").default(true).notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  triggerType: mysqlEnum("triggerType", ["manual", "scheduled", "webhook", "event"]).default("manual").notNull(),
  cronExpression: varchar("cronExpression", { length: 100 }),
  webhookUrl: varchar("webhookUrl", { length: 500 }),
  runCount: int("runCount").default(0),
  successCount: int("successCount").default(0),
  failCount: int("failCount").default(0),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const workflowsRelations = relations(workflows, ({ one }) => ({
  user: one(users, { fields: [workflows.userId], references: [users.id] }),
}));

export const workflowExecutions = mysqlTable("workflow_executions", {
  id: serial("id").primaryKey(),
  workflowId: bigint("workflowId", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", ["running", "completed", "failed", "cancelled"]).default("running").notNull(),
  input: json("input"),
  output: json("output"),
  nodeResults: json("nodeResults"),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  duration: int("duration"),
});

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
    "openrouter",
    "groq",
    "deepseek",
    "mistral",
    "cohere",
    "azure",
  ]).notNull(),
  endpoint: varchar("endpoint", { length: 500 }),
  apiKey: varchar("apiKey", { length: 500 }),
  config: json("config"),
  isActive: boolean("isActive").default(true).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
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
    "story",
    "analysis",
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "cancelled"]).default("pending").notNull(),
  prompt: longtext("prompt").notNull(),
  modelId: varchar("modelId", { length: 255 }).notNull(),
  parameters: json("parameters"),
  result: longtext("result"),
  resultUrl: text("resultUrl"),
  errorMessage: text("errorMessage"),
  tokensUsed: int("tokensUsed"),
  tokensInput: int("tokensInput"),
  tokensOutput: int("tokensOutput"),
  duration: int("duration"),
  cost: float("cost").default(0),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const stories = mysqlTable("stories", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  genre: mysqlEnum("genre", [
    "fantasy",
    "sci_fi",
    "horror",
    "romance",
    "mystery",
    "thriller",
    "adventure",
    "historical",
    "drama",
    "comedy",
    "dystopian",
    "cyberpunk",
    "steampunk",
    "supernatural",
    "noir",
    "custom",
  ]).default("fantasy").notNull(),
  tone: mysqlEnum("tone", [
    "dark",
    "light",
    "humorous",
    "serious",
    "epic",
    "intimate",
    "suspenseful",
    "whimsical",
    "gritty",
    "inspirational",
  ]).default("epic").notNull(),
  targetAudience: mysqlEnum("targetAudience", [
    "children",
    "young_adult",
    "adult",
    "all_ages",
  ]).default("adult").notNull(),
  premise: text("premise"),
  setting: text("setting"),
  mainCharacters: json("mainCharacters"),
  plotOutline: json("plotOutline"),
  chapters: json("chapters"),
  wordCount: int("wordCount").default(0),
  chapterCount: int("chapterCount").default(0),
  currentChapter: int("currentChapter").default(0),
  status: mysqlEnum("status", [
    "draft",
    "in_progress",
    "completed",
    "abandoned",
  ]).default("draft").notNull(),
  visibility: mysqlEnum("visibility", ["private", "public", "shared"]).default("private").notNull(),
  language: varchar("language", { length: 10 }).default("pt-BR"),
  modelId: varchar("modelId", { length: 255 }),
  temperature: float("temperature").default(0.8),
  metadata: json("metadata"),
  tags: json("tags"),
  rating: float("rating").default(0),
  ratingCount: int("ratingCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const storiesRelations = relations(stories, ({ one }) => ({
  user: one(users, { fields: [stories.userId], references: [users.id] }),
}));

export const codeProjects = mysqlTable("code_projects", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  language: varchar("language", { length: 50 }).notNull(),
  framework: varchar("framework", { length: 100 }),
  type: mysqlEnum("type", [
    "web_app",
    "api",
    "cli",
    "library",
    "script",
    "mobile_app",
    "desktop_app",
    "game",
    "ml_model",
    "data_pipeline",
    "automation",
    "other",
  ]).default("web_app").notNull(),
  requirements: json("requirements"),
  architecture: json("architecture"),
  files: json("files"),
  codeSnippets: json("codeSnippets"),
  documentation: longtext("documentation"),
  tests: json("tests"),
  dependencies: json("dependencies"),
  status: mysqlEnum("status", [
    "planning",
    "in_progress",
    "code_review",
    "completed",
    "archived",
  ]).default("planning").notNull(),
  visibility: mysqlEnum("visibility", ["private", "public"]).default("private").notNull(),
  modelId: varchar("modelId", { length: 255 }),
  lineCount: int("lineCount").default(0),
  fileCount: int("fileCount").default(0),
  testCoverage: float("testCoverage").default(0),
  metadata: json("metadata"),
  tags: json("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const codeProjectsRelations = relations(codeProjects, ({ one }) => ({
  user: one(users, { fields: [codeProjects.userId], references: [users.id] }),
}));

export const trainingJobs = mysqlTable("training_jobs", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  baseModel: varchar("baseModel", { length: 255 }).notNull(),
  targetModel: varchar("targetModel", { length: 255 }),
  trainingType: mysqlEnum("trainingType", [
    "fine_tuning",
    "rlhf",
    "dpo",
    "distillation",
    "pretraining",
    "continuation",
    "grpo",
    "sft",
    "lora",
    "qlora",
  ]).default("fine_tuning").notNull(),
  datasetId: bigint("datasetId", { mode: "number", unsigned: true }),
  hyperparameters: json("hyperparameters"),
  status: mysqlEnum("status", [
    "queued",
    "preparing",
    "running",
    "paused",
    "completed",
    "failed",
    "cancelled",
  ]).default("queued").notNull(),
  progress: float("progress").default(0),
  currentEpoch: int("currentEpoch").default(0),
  totalEpochs: int("totalEpochs").default(0),
  currentStep: int("currentStep").default(0),
  totalSteps: int("totalSteps").default(0),
  loss: float("loss"),
  learningRate: float("learningRate"),
  evalResults: json("evalResults"),
  outputModelUrl: text("outputModelUrl"),
  outputModelPath: text("outputModelPath"),
  huggingfaceRepo: varchar("huggingfaceRepo", { length: 255 }),
  logs: longtext("logs"),
  errorMessage: text("errorMessage"),
  gpuType: varchar("gpuType", { length: 100 }),
  gpuCount: int("gpuCount").default(1),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  estimatedDuration: int("estimatedDuration"),
  actualDuration: int("actualDuration"),
  cost: float("cost").default(0),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const trainingJobsRelations = relations(trainingJobs, ({ one }) => ({
  user: one(users, { fields: [trainingJobs.userId], references: [users.id] }),
}));

export const datasets = mysqlTable("datasets", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", [
    "text",
    "conversation",
    "code",
    "instruction",
    "preference",
    "synthetic",
    "multimodal",
    "embedding",
    "classification",
    "qa",
  ]).default("text").notNull(),
  format: mysqlEnum("format", [
    "jsonl",
    "csv",
    "parquet",
    "json",
    "txt",
    "huggingface",
  ]).default("jsonl").notNull(),
  source: varchar("source", { length: 255 }),
  huggingfaceDataset: varchar("huggingfaceDataset", { length: 255 }),
  recordCount: int("recordCount").default(0),
  sizeBytes: bigint("sizeBytes", { mode: "number", unsigned: true }).default(0),
  schema: json("schema"),
  sampleData: json("sampleData"),
  preprocessing: json("preprocessing"),
  splits: json("splits"),
  quality: json("quality"),
  license: varchar("license", { length: 100 }),
  tags: json("tags"),
  isPublic: boolean("isPublic").default(false).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const datasetsRelations = relations(datasets, ({ one }) => ({
  user: one(users, { fields: [datasets.userId], references: [users.id] }),
}));

export const prompts = mysqlTable("prompts", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  template: longtext("template").notNull(),
  variables: json("variables"),
  category: mysqlEnum("category", [
    "programming",
    "writing",
    "analysis",
    "creative",
    "business",
    "education",
    "research",
    "general",
    "system",
    "other",
  ]).default("general").notNull(),
  tags: json("tags"),
  isPublic: boolean("isPublic").default(false).notNull(),
  useCount: int("useCount").default(0),
  avgRating: float("avgRating").default(0),
  ratingCount: int("ratingCount").default(0),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const promptsRelations = relations(prompts, ({ one }) => ({
  user: one(users, { fields: [prompts.userId], references: [users.id] }),
}));

export const apiKeys = mysqlTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("keyHash", { length: 255 }).notNull(),
  keyPrefix: varchar("keyPrefix", { length: 20 }),
  scopes: json("scopes"),
  rateLimit: int("rateLimit").default(60),
  usageCount: int("usageCount").default(0),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const pluginRegistry = mysqlTable("plugin_registry", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 50 }).notNull(),
  author: varchar("author", { length: 255 }),
  category: mysqlEnum("category", [
    "model_provider",
    "vector_store",
    "tool",
    "agent_skill",
    "integration",
    "workflow_node",
    "formatter",
    "other",
  ]).notNull(),
  entryPoint: varchar("entryPoint", { length: 500 }).notNull(),
  configSchema: json("configSchema"),
  isActive: boolean("isActive").default(true).notNull(),
  isBuiltIn: boolean("isBuiltIn").default(false).notNull(),
  installCount: int("installCount").default(0),
  rating: float("rating").default(0),
  sourceUrl: text("sourceUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const openSourceCatalog = mysqlTable("open_source_catalog", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  githubUrl: text("githubUrl").notNull(),
  documentationUrl: text("documentationUrl"),
  demoUrl: text("demoUrl"),
  category: mysqlEnum("category", [
    "llm",
    "vision",
    "audio",
    "multimodal",
    "agent_framework",
    "rag",
    "training",
    "inference",
    "vector_database",
    "tool",
    "ui",
    "workflow",
    "memory",
    "evaluation",
    "data_processing",
    "other",
  ]).notNull(),
  language: varchar("language", { length: 50 }),
  stars: int("stars").default(0),
  forks: int("forks").default(0),
  license: varchar("license", { length: 100 }),
  lastCommitAt: timestamp("lastCommitAt"),
  version: varchar("version", { length: 50 }),
  features: json("features"),
  installation: text("installation"),
  usage: text("usage"),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  tags: json("tags"),
  metadata: json("metadata"),
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
export type Story = typeof stories.$inferSelect;
export type InsertStory = typeof stories.$inferInsert;
export type CodeProject = typeof codeProjects.$inferSelect;
export type InsertCodeProject = typeof codeProjects.$inferInsert;
export type TrainingJob = typeof trainingJobs.$inferSelect;
export type InsertTrainingJob = typeof trainingJobs.$inferInsert;
export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = typeof datasets.$inferInsert;
export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = typeof prompts.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type PluginRegistry = typeof pluginRegistry.$inferSelect;
export type InsertPluginRegistry = typeof pluginRegistry.$inferInsert;
export type OpenSourceCatalog = typeof openSourceCatalog.$inferSelect;
export type InsertOpenSourceCatalog = typeof openSourceCatalog.$inferInsert;
