import type { AIProvider, AIRequest, AIResponse, ProviderConfig } from "../engine/ai-engine";

export class AnthropicProvider implements AIProvider {
  name = "Anthropic";
  id = "anthropic";
  supportsStreaming = true;
  supportsTools = true;
  supportsVision = true;
  supportsJSON = true;
  models = [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
    "claude-sonnet-4-5",
    "claude-haiku-3-5",
  ];

  async generate(request: AIRequest, config: ProviderConfig): Promise<AIResponse> {
    const url = `${config.baseUrl || "https://api.anthropic.com"}/v1/messages`;
    const body = this.buildRequestBody(request);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  async generateStream(
    request: AIRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    const url = `${config.baseUrl || "https://api.anthropic.com"}/v1/messages`;
    const body = this.buildRequestBody(request, true);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    let fullContent = "";
    let reasoning = "";
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim().startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.delta;
            if (delta?.text) {
              fullContent += delta.text;
              onChunk(delta.text);
            }
            if (delta?.thinking) {
              reasoning += delta.thinking;
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
      reasoning: reasoning || undefined,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      model: request.model,
      latency: 0,
    };
  }

  private buildRequestBody(request: AIRequest, stream = false): Record<string, unknown> {
    const messages = request.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      ...(msg.toolCalls ? { tool_calls: msg.toolCalls } : {}),
    }));

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      top_p: request.topP ?? 0.9,
      stream,
    };

    if (request.systemPrompt) {
      body.system = request.systemPrompt;
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map((tool) => ({
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters,
      }));
    }

    return body;
  }

  private parseResponse(data: Record<string, unknown>): AIResponse {
    const content = (data.content as Array<Record<string, unknown>>)?.find(
      (c) => c.type === "text"
    );
    const usage = data.usage as Record<string, number>;

    return {
      content: (content?.text as string) || "",
      usage: {
        inputTokens: usage?.input_tokens || 0,
        outputTokens: usage?.output_tokens || 0,
        totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
      },
      model: (data.model as string) || "",
      latency: 0,
    };
  }
}
