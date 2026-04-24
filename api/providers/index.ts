import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { GoogleProvider } from "./google-provider";
import { DeepSeekProvider } from "./deepseek-provider";
import { OllamaProvider } from "./ollama-provider";
import { aiEngine } from "../engine/ai-engine";

export function registerAllProviders(): void {
  aiEngine.registerProvider(new OpenAIProvider());
  aiEngine.registerProvider(new AnthropicProvider());
  aiEngine.registerProvider(new GoogleProvider());
  aiEngine.registerProvider(new DeepSeekProvider());
  aiEngine.registerProvider(new OllamaProvider());
}

export * from "./openai-provider";
export * from "./anthropic-provider";
export * from "./google-provider";
export * from "./deepseek-provider";
export * from "./ollama-provider";
