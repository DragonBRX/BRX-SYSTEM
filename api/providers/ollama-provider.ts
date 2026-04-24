import type { AIProvider, AIRequest, AIResponse, ProviderConfig } from "../engine/ai-engine";

export class OllamaProvider implements AIProvider {
  name = "Ollama";
  id = "ollama";
  supportsStreaming = true;
  supportsTools = true;
  supportsVision = true;
  supportsJSON = true;
  models = [
    "llama3.3",
    "llama3.2",
    "llama3.1",
    "llama3",
    "mistral",
    "mixtral",
    "codellama",
    "qwen2.5",
    "qwen2",
    "deepseek-coder-v2",
    "phi4",
    "phi3",
    "gemma2",
    "nomic-embed-text",
    "llava",
    "granite3.1-dense",
    "athene-v2",
  ];

  async generate(request: AIRequest, config: ProviderConfig): Promise<AIResponse> {
    const url = `${config.baseUrl || "http://localhost:11434"}/api/chat`;
    const body = this.buildRequestBody(request);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return this.parseResponse(data, request.model);
  }

  async generateStream(
    request: AIRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    const url = `${config.baseUrl || "http://localhost:11434"}/api/chat`;
    const body = this.buildRequestBody(request, true);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    let fullContent = "";
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const text = parsed.message?.content || "";
            if (text) {
              fullContent += text;
              onChunk(text);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content: fullContent,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      model: request.model,
      latency: 0,
    };
  }

  async listModels(config: ProviderConfig): Promise<Array<{ name: string; size: number; parameter?: string }>> {
    const url = `${config.baseUrl || "http://localhost:11434"}/api/tags`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.models || []).map((m: Record<string, unknown>) => ({
      name: m.name as string,
      size: m.size as number,
      parameter: (m.details as Record<string, unknown>)?.parameter as string,
    }));
  }

  async pullModel(model: string, config: ProviderConfig): Promise<void> {
    const url = `${config.baseUrl || "http://localhost:11434"}/api/pull`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: model, stream: false }),
    });

    if (!response.ok) {
      throw new Error(`Ollama pull error: ${response.status}`);
    }
  }

  private buildRequestBody(request: AIRequest, stream = false): Record<string, unknown> {
    const messages = request.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    if (request.systemPrompt) {
      messages.unshift({ role: "system", content: request.systemPrompt });
    }

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      stream,
      options: {
        temperature: request.temperature ?? 0.7,
        num_predict: request.maxTokens ?? 2048,
        top_p: request.topP ?? 0.9,
        frequency_penalty: request.frequencyPenalty ?? 0,
        presence_penalty: request.presencePenalty ?? 0,
      },
    };

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools;
    }

    if (request.responseFormat === "json") {
      body.format = "json";
    }

    return body;
  }

  private parseResponse(data: Record<string, unknown>, model: string): AIResponse {
    const message = data.message as Record<string, unknown>;

    return {
      content: (message?.content as string) || "",
      usage: {
        inputTokens: (data.prompt_eval_count as number) || 0,
        outputTokens: (data.eval_count as number) || 0,
        totalTokens:
          ((data.prompt_eval_count as number) || 0) + ((data.eval_count as number) || 0),
      },
      model,
      latency: 0,
    };
  }
}
