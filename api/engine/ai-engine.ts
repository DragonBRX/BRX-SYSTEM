import { Hono } from "hono";
import { stream, streamText, streamSSE } from "hono/streaming";

export interface AIMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  reasoning?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  toolCallId: string;
  output: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  stream?: boolean;
  tools?: AITool[];
  responseFormat?: "text" | "json";
}

export interface AIResponse {
  content: string;
  reasoning?: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  latency: number;
  citations?: Citation[];
}

export interface Citation {
  title: string;
  url?: string;
  snippet?: string;
}

export interface AITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export interface AIProvider {
  name: string;
  id: string;
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsJSON: boolean;
  models: string[];
  generate(request: AIRequest, config: ProviderConfig): Promise<AIResponse>;
  generateStream(
    request: AIRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse>;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  organization?: string;
}

export class AIEngine {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider: string = "openai";

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  setDefaultProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider ${providerId} not registered`);
    }
    this.defaultProvider = providerId;
  }

  getProvider(providerId?: string): AIProvider {
    const id = providerId || this.defaultProvider;
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider ${id} not found`);
    }
    return provider;
  }

  listProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  async generate(request: AIRequest, providerId?: string, config?: ProviderConfig): Promise<AIResponse> {
    const provider = this.getProvider(providerId);
    const startTime = Date.now();

    if (!config) {
      config = await this.getProviderConfig(provider.id);
    }

    const response = await provider.generate(request, config);
    response.latency = Date.now() - startTime;
    return response;
  }

  async generateStream(
    request: AIRequest,
    onChunk: (chunk: string) => void,
    providerId?: string,
    config?: ProviderConfig
  ): Promise<AIResponse> {
    const provider = this.getProvider(providerId);
    const startTime = Date.now();

    if (!config) {
      config = await this.getProviderConfig(provider.id);
    }

    const response = await provider.generateStream(request, config, onChunk);
    response.latency = Date.now() - startTime;
    return response;
  }

  private async getProviderConfig(providerId: string): Promise<ProviderConfig> {
    return {
      apiKey: process.env[`${providerId.toUpperCase()}_API_KEY`] || "",
      baseUrl: process.env[`${providerId.toUpperCase()}_BASE_URL`],
    };
  }
}

export const aiEngine = new AIEngine();
