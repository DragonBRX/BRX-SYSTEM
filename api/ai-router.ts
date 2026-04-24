import { z } from "zod";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { aiModels, conversations, messages, generationTasks } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const aiRouter = createRouter({
  modelList: publicQuery.query(async () => {
    const db = getDb();
    return db.query.aiModels.findMany({
      where: eq(aiModels.isActive, true),
      orderBy: desc(aiModels.rating),
    });
  }),

  modelSearch: publicQuery
    .input(z.object({ query: z.string(), category: z.string().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [eq(aiModels.isActive, true)];
      if (input.query) {
        conditions.push(
          sql`${aiModels.name} LIKE ${"%" + input.query + "%"} OR ${aiModels.description} LIKE ${"%" + input.query + "%"}`
        );
      }
      if (input.category) {
        conditions.push(eq(aiModels.category, input.category as any));
      }
      return db.query.aiModels.findMany({
        where: and(...conditions),
        orderBy: desc(aiModels.downloads),
      });
    }),

  modelById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.aiModels.findFirst({
        where: eq(aiModels.id, input.id),
      });
    }),

  createModel: adminQuery
    .input(z.object({
      name: z.string().min(1),
      provider: z.string(),
      modelId: z.string(),
      description: z.string().optional(),
      category: z.enum(["llm", "vision", "audio", "multimodal", "embedding", "code", "agent"]),
      architecture: z.string().optional(),
      parameters: z.string().optional(),
      quantization: z.string().optional(),
      contextWindow: z.number().optional(),
      license: z.string().optional(),
      sourceUrl: z.string().optional(),
      isLocal: z.boolean().default(false),
      tags: z.array(z.string()).optional(),
      capabilities: z.array(z.string()).optional(),
      config: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(aiModels).values(input);
      return { id: Number(result.insertId) };
    }),

  updateModel: adminQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      config: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(aiModels).set(input).where(eq(aiModels.id, input.id));
      return { success: true };
    }),

  deleteModel: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(aiModels).where(eq(aiModels.id, input.id));
      return { success: true };
    }),

  conversationList: authedQuery
    .input(z.object({ archived: z.boolean().default(false) }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const uid = ctx.user.id;
      return db.query.conversations.findMany({
        where: and(
          eq(conversations.userId, uid),
          eq(conversations.isArchived, input?.archived ?? false)
        ),
        orderBy: desc(conversations.updatedAt),
      });
    }),

  conversationById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conv = await db.query.conversations.findFirst({
        where: and(eq(conversations.id, input.id), eq(conversations.userId, ctx.user.id)),
      });
      if (!conv) return null;
      const msgs = await db.query.messages.findMany({
        where: eq(messages.conversationId, input.id),
        orderBy: messages.createdAt,
      });
      return { ...conv, messages: msgs };
    }),

  createConversation: authedQuery
    .input(z.object({
      title: z.string().min(1),
      modelId: z.string(),
      systemPrompt: z.string().optional(),
      temperature: z.number().min(0).max(2).default(0.7),
      maxTokens: z.number().min(1).max(65536).default(2048),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(conversations).values({
        ...input,
        userId: ctx.user.id,
      }).$returningId();
      return result;
    }),

  updateConversation: authedQuery
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      isArchived: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.update(conversations)
        .set(input)
        .where(and(eq(conversations.id, input.id), eq(conversations.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteConversation: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(messages).where(eq(messages.conversationId, input.id));
      await db.delete(conversations).where(
        and(eq(conversations.id, input.id), eq(conversations.userId, ctx.user.id))
      );
      return { success: true };
    }),

  sendMessage: authedQuery
    .input(z.object({
      conversationId: z.number(),
      content: z.string().min(1),
      role: z.enum(["user", "assistant"]).default("user"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const conv = await db.query.conversations.findFirst({
        where: and(eq(conversations.id, input.conversationId), eq(conversations.userId, ctx.user.id)),
      });
      if (!conv) throw new Error("Conversation not found");

      const [msgResult] = await db.insert(messages).values({
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
      });

      await db.update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, input.conversationId));

      return msgResult;
    }),

  generate: authedQuery
    .input(z.object({
      type: z.enum(["text", "image", "audio", "video", "embedding", "code"]),
      prompt: z.string().min(1),
      modelId: z.string(),
      parameters: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const start = Date.now();
      
      const [task] = await db.insert(generationTasks).values({
        userId: ctx.user.id,
        type: input.type,
        prompt: input.prompt,
        modelId: input.modelId,
        parameters: input.parameters ?? {},
        status: "running",
      });

      const mockResult = `[${input.type.toUpperCase()} GENERATION MOCK] Model: ${input.modelId} | Prompt: ${input.prompt.slice(0, 100)}... | Duration: ${Date.now() - start}ms | This is a simulated response. In production, integrate with Ollama, vLLM, llama.cpp, or external APIs.`;

      await db.update(generationTasks)
        .set({
          status: "completed",
          result: mockResult,
          duration: Date.now() - start,
          tokensUsed: Math.floor(input.prompt.length * 1.5),
        })
        .where(eq(generationTasks.id, Number((task as any).insertId)));

      return { taskId: Number((task as any).insertId), result: mockResult };
    }),

  generationStatus: authedQuery
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return db.query.generationTasks.findFirst({
        where: and(
          eq(generationTasks.id, input.taskId),
          eq(generationTasks.userId, ctx.user.id)
        ),
      });
    }),

  generationHistory: authedQuery
    .input(z.object({ type: z.string().optional(), limit: z.number().default(50) }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return db.query.generationTasks.findMany({
        where: and(
          eq(generationTasks.userId, ctx.user.id),
          input?.type ? eq(generationTasks.type, input.type as any) : undefined
        ),
        orderBy: desc(generationTasks.createdAt),
        limit: input?.limit ?? 50,
      });
    }),

  seedModels: adminQuery.mutation(async () => {
    const db = getDb();
    const defaultModels = [
      {
        name: "Llama 3.3 70B",
        provider: "Meta",
        modelId: "llama3.3:70b",
        description: "State-of-the-art large language model from Meta with 70B parameters. Supports 128K context window and multilingual capabilities.",
        category: "llm" as const,
        architecture: "Transformer",
        parameters: "70B",
        quantization: "Q4_K_M",
        contextWindow: 128000,
        license: "Llama 3.3 License",
        sourceUrl: "https://github.com/meta-llama/llama-models",
        isLocal: true,
        tags: ["llama", "meta", "multilingual"],
        capabilities: ["chat", "reasoning", "coding", "analysis"],
        downloads: 1500000,
        rating: 4.8,
      },
      {
        name: "DeepSeek R1",
        provider: "DeepSeek",
        modelId: "deepseek-r1:70b",
        description: "Open-source reasoning model with chain-of-thought. Excels at math, coding, and logical reasoning tasks.",
        category: "llm" as const,
        architecture: "Transformer",
        parameters: "70B",
        quantization: "Q4_K_M",
        contextWindow: 64000,
        license: "MIT",
        sourceUrl: "https://github.com/deepseek-ai/DeepSeek-R1",
        isLocal: true,
        tags: ["deepseek", "reasoning", "chain-of-thought"],
        capabilities: ["reasoning", "math", "coding", "analysis"],
        downloads: 800000,
        rating: 4.9,
      },
      {
        name: "Qwen 2.5 VL",
        provider: "Alibaba",
        modelId: "qwen2.5-vl:72b",
        description: "Multimodal vision-language model capable of understanding images, documents, and video with high accuracy.",
        category: "multimodal" as const,
        architecture: "Transformer",
        parameters: "72B",
        quantization: "Q4_K_M",
        contextWindow: 32768,
        license: "Apache-2.0",
        sourceUrl: "https://github.com/QwenLM/Qwen2.5-VL",
        isLocal: true,
        tags: ["qwen", "vision", "multimodal", "document"],
        capabilities: ["vision", "ocr", "document", "video"],
        downloads: 500000,
        rating: 4.7,
      },
      {
        name: "LLaVA OneVision",
        provider: "LLaVA",
        modelId: "llava-onevision:qwen2-72b",
        description: "Fully open framework for multimodal training. State-of-the-art performance on vision-language benchmarks.",
        category: "vision" as const,
        architecture: "Transformer",
        parameters: "72B",
        quantization: "Q4_K_M",
        contextWindow: 16384,
        license: "Apache-2.0",
        sourceUrl: "https://github.com/EvolvingLMMs-Lab/LLaVA-OneVision-1.5",
        isLocal: true,
        tags: ["llava", "vision", "image", "benchmark"],
        capabilities: ["vision", "image-analysis", "chart", "diagram"],
        downloads: 300000,
        rating: 4.6,
      },
      {
        name: "Whisper Large v3",
        provider: "OpenAI",
        modelId: "whisper-large-v3",
        description: "Robust speech recognition model supporting 99 languages. Open-source and runnable locally via whisper.cpp.",
        category: "audio" as const,
        architecture: "Transformer",
        parameters: "1.5B",
        quantization: "Q5_0",
        contextWindow: 1500,
        license: "MIT",
        sourceUrl: "https://github.com/openai/whisper",
        isLocal: true,
        tags: ["whisper", "speech", "transcription", "translation"],
        capabilities: ["transcription", "translation", "speech-recognition"],
        downloads: 2000000,
        rating: 4.8,
      },
      {
        name: "Stable Diffusion 3.5",
        provider: "Stability AI",
        modelId: "sd3.5-large",
        description: "Latest open-source image generation model with exceptional quality and prompt adherence.",
        category: "vision" as const,
        architecture: "MMDiT",
        parameters: "8B",
        quantization: "FP16",
        contextWindow: 77,
        license: "Stability AI Community License",
        sourceUrl: "https://github.com/Stability-AI/stablediffusion",
        isLocal: true,
        tags: ["stable-diffusion", "image", "generation", "art"],
        capabilities: ["text-to-image", "image-to-image", "inpainting"],
        downloads: 3000000,
        rating: 4.7,
      },
      {
        name: "Nomic Embed Text v1.5",
        provider: "Nomic",
        modelId: "nomic-embed-text:v1.5",
        description: "High-quality open-source embedding model for RAG and semantic search applications.",
        category: "embedding" as const,
        architecture: "BERT",
        parameters: "137M",
        quantization: "Q8_0",
        contextWindow: 8192,
        license: "Apache-2.0",
        sourceUrl: "https://github.com/nomic-ai/nomic",
        isLocal: true,
        tags: ["nomic", "embedding", "rag", "search"],
        capabilities: ["embedding", "semantic-search", "clustering"],
        downloads: 900000,
        rating: 4.5,
      },
      {
        name: "CodeLlama 70B",
        provider: "Meta",
        modelId: "codellama:70b",
        description: "Specialized code generation and completion model supporting 500+ programming languages.",
        category: "code" as const,
        architecture: "Transformer",
        parameters: "70B",
        quantization: "Q4_K_M",
        contextWindow: 16384,
        license: "Llama 3 License",
        sourceUrl: "https://github.com/meta-llama/codellama",
        isLocal: true,
        tags: ["codellama", "coding", "completion", "infilling"],
        capabilities: ["code-generation", "completion", "infilling", "debugging"],
        downloads: 700000,
        rating: 4.6,
      },
      {
        name: "Mistral Small 3.1",
        provider: "Mistral AI",
        modelId: "mistral-small:24b",
        description: "Efficient open-source model with strong reasoning and tool-use capabilities. Apache 2.0 licensed.",
        category: "llm" as const,
        architecture: "Transformer",
        parameters: "24B",
        quantization: "Q4_K_M",
        contextWindow: 128000,
        license: "Apache-2.0",
        sourceUrl: "https://github.com/mistralai/mistral-inference",
        isLocal: true,
        tags: ["mistral", "tool-use", "efficient"],
        capabilities: ["chat", "tool-use", "reasoning", "function-calling"],
        downloads: 450000,
        rating: 4.5,
      },
      {
        name: "Gemma 3 27B",
        provider: "Google",
        modelId: "gemma3:27b",
        description: "Google's open-weight model with multimodal capabilities and long-context support up to 128K tokens.",
        category: "multimodal" as const,
        architecture: "Transformer",
        parameters: "27B",
        quantization: "Q4_K_M",
        contextWindow: 128000,
        license: "Gemma Terms",
        sourceUrl: "https://github.com/google-deepmind/gemma",
        isLocal: true,
        tags: ["gemma", "google", "multimodal", "long-context"],
        capabilities: ["chat", "vision", "coding", "reasoning"],
        downloads: 350000,
        rating: 4.6,
      },
      {
        name: "Phi-4 Multimodal",
        provider: "Microsoft",
        modelId: "phi4-multimodal",
        description: "Compact yet powerful multimodal model from Microsoft. Excellent for vision, speech, and text tasks.",
        category: "multimodal" as const,
        architecture: "Transformer",
        parameters: "5.6B",
        quantization: "Q4_K_M",
        contextWindow: 128000,
        license: "MIT",
        sourceUrl: "https://github.com/microsoft/Phi-4-multimodal",
        isLocal: true,
        tags: ["phi", "microsoft", "compact", "speech"],
        capabilities: ["vision", "speech", "text", "lightweight"],
        downloads: 280000,
        rating: 4.4,
      },
    ];

    for (const model of defaultModels) {
      const existing = await db.query.aiModels.findFirst({
        where: eq(aiModels.modelId, model.modelId),
      });
      if (!existing) {
        await db.insert(aiModels).values(model);
      }
    }

    return { seeded: defaultModels.length };
  }),
});
