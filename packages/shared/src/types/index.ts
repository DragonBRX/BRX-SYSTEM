// BRX SYSTEM - Shared TypeScript Types

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: "idle" | "thinking" | "using_tool" | "completed" | "error";
  llmProvider: string;
  model: string;
  tools: string[];
  memoryEnabled: boolean;
  createdAt: string;
}

export interface AgentExecution {
  executionId: string;
  agentName: string;
  query: string;
  output: string;
  status: string;
  steps: number;
  durationMs: number;
  tokensUsed: number;
  toolsUsed: string[];
  createdAt: string;
}

export interface Document {
  id: string;
  source: string;
  title: string;
  content: string;
  docType: string;
  chunkCount: number;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface RAGQuery {
  query: string;
  topK?: number;
  filterMetadata?: Record<string, any>;
}

export interface RAGResponse {
  query: string;
  answer: string;
  sources: Array<{
    content: string;
    score: number;
    documentTitle: string;
  }>;
  model: string;
  tokensUsed: number;
  retrievalTimeMs: number;
  generationTimeMs: number;
  totalTimeMs: number;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  context: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  stars: number;
  language: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
}

export interface SystemStats {
  cpuPercent: number;
  memory: {
    total: number;
    available: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
}
