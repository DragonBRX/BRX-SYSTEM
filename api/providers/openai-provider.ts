import type { AIProvider, AIRequest, AIResponse, ProviderConfig, AIMessage } from "../engine/ai-engine";

export class OpenAIProvider implements AIProvider {
  name = "OpenAI";
  id = "openai";
  supportsStreaming = true;
  supportsTools = true;
  supportsVision = true;
  supportsJSON = true;
  models = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
    "o1-preview",
    "o1-mini",
    "o3-mini",
  ];

  async generate(request: AIRequest, config: ProviderConfig): Promise<AIResponse> {
    const url = `${config.baseUrl || "https://api.openai.com/v1"}/chat/completions`;
    const body = this.buildRequestBody(request);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...(config.organization ? { "OpenAI-Organization": config.organization } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  async generateStream(
    request: AIRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    const url = `${config.baseUrl || "https://api.openai.com/v1"}/chat/completions`;
    const body = this.buildRequestBody(request, true);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...(config.organization ? { "OpenAI-Organization": config.organization } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
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
    const messages: Array<Record<string, unknown>> = [];

    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }

    for (const msg of request.messages) {
      const message: Record<string, unknown> = { role: msg.role, content: msg.content };
      if (msg.toolCalls) {
        message.tool_calls = msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: tc.type,
          function: tc.function,
        }));
      }
      messages.push(message);
    }

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
      top_p: request.topP ?? 0.9,
      frequency_penalty: request.frequencyPenalty ?? 0,
      presence_penalty: request.presencePenalty ?? 0,
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
      toolCalls: (message?.tool_calls as AIResponse["toolCalls"]) || undefined,
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
