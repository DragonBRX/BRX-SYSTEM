import type { AIProvider, AIRequest, AIResponse, ProviderConfig } from "../engine/ai-engine";

export class GoogleProvider implements AIProvider {
  name = "Google Gemini";
  id = "google";
  supportsStreaming = true;
  supportsTools = true;
  supportsVision = true;
  supportsJSON = true;
  models = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-pro-exp-03-25",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
  ];

  async generate(request: AIRequest, config: ProviderConfig): Promise<AIResponse> {
    const modelId = request.model.startsWith("gemini-") ? request.model : "gemini-2.0-flash";
    const url = `${config.baseUrl || "https://generativelanguage.googleapis.com/v1beta"}/models/${modelId}:generateContent?key=${config.apiKey}`;

    const body = this.buildRequestBody(request);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return this.parseResponse(data, request.model);
  }

  async generateStream(
    request: AIRequest,
    config: ProviderConfig,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    const modelId = request.model.startsWith("gemini-") ? request.model : "gemini-2.0-flash";
    const url = `${config.baseUrl || "https://generativelanguage.googleapis.com/v1beta"}/models/${modelId}:streamGenerateContent?alt=sse&key=${config.apiKey}`;

    const body = this.buildRequestBody(request);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${response.status} - ${error}`);
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
        const lines = chunk.split("\n").filter((line) => line.trim().startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            const text = (parsed.candidates?.[0]?.content?.parts?.[0]?.text as string) || "";
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

  private buildRequestBody(request: AIRequest): Record<string, unknown> {
    const contents = request.messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : msg.role,
      parts: [{ text: msg.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 2048,
        topP: request.topP ?? 0.9,
        topK: 40,
      },
    };

    if (request.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: request.systemPrompt }],
      };
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = [
        {
          functionDeclarations: request.tools.map((tool) => ({
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters,
          })),
        },
      ];
    }

    return body;
  }

  private parseResponse(data: Record<string, unknown>, model: string): AIResponse {
    const candidate = (data.candidates as Array<Record<string, unknown>>)?.[0];
    const content = candidate?.content as Record<string, unknown>;
    const parts = content?.parts as Array<Record<string, unknown>>;
    const text = parts?.find((p) => p.text)?.text as string;
    const usage = data.usageMetadata as Record<string, number>;

    return {
      content: text || "",
      usage: {
        inputTokens: usage?.promptTokenCount || 0,
        outputTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0,
      },
      model,
      latency: 0,
    };
  }
}
