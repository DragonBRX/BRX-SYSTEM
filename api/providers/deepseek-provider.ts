import type { AIProvider, AIRequest, AIResponse, ProviderConfig } from "../engine/ai-engine";

export class DeepSeekProvider implements AIProvider {
  name = "DeepSeek";
  id = "deepseek";
  supportsStreaming = true;
  supportsTools = true;
  supportsVision = false;
  supportsJSON = true;
  models = [
    "deepseek-chat",
    "deepseek-reasoner",
    "deepseek-coder",
    "deepseek-llm-67b-chat",
    "deepseek-moe-16b-chat",
  ];

  async generate(request: AIRequest, config: ProviderConfig): Promise<AIResponse> {
    const url = `${config.baseUrl || "https://api.deepseek.com"}/chat/completions`;
    const body = this.buildRequestBody(request);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  async generateStream(
    request: AIRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    const url = `${config.baseUrl || "https://api.deepseek.com"}/chat/completions`;
    const body = this.buildRequestBody(request, true);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
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
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) {
              fullContent += delta.content;
              onChunk(delta.content);
            }
            if (delta?.reasoning_content) {
              reasoning += delta.reasoning_content;
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
    }));

    if (request.systemPrompt) {
      messages.unshift({ role: "system", content: request.systemPrompt });
    }

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
      top_p: request.topP ?? 0.9,
      stream,
    };

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools;
    }

    if (request.responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }

    return body;
  }

  private parseResponse(data: Record<string, unknown>): AIResponse {
    const choice = (data.choices as Array<Record<string, unknown>>)?.[0];
    const message = choice?.message as Record<string, unknown>;
    const usage = data.usage as Record<string, number>;

    return {
      content: (message?.content as string) || "",
      reasoning: (message?.reasoning_content as string) || undefined,
      usage: {
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      },
      model: (data.model as string) || "",
      latency: 0,
    };
  }
}
