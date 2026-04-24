import { z } from "zod";
import { createRouter, publicQuery, authedMutation } from "./middleware";
import { db } from "./queries/connection";
import { openSourceCatalog } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";

export const catalogRouter = createRouter({
  list: publicQuery.query(async () => {
    const result = await db
      .select()
      .from(openSourceCatalog)
      .where(eq(openSourceCatalog.isActive, true))
      .orderBy(desc(openSourceCatalog.stars));
    return result;
  }),

  listFeatured: publicQuery.query(async () => {
    const result = await db
      .select()
      .from(openSourceCatalog)
      .where(and(eq(openSourceCatalog.isActive, true), eq(openSourceCatalog.isFeatured, true)))
      .orderBy(desc(openSourceCatalog.stars));
    return result;
  }),

  byCategory: publicQuery
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(openSourceCatalog)
        .where(
          and(
            eq(openSourceCatalog.isActive, true),
            eq(openSourceCatalog.category, input.category as any)
          )
        )
        .orderBy(desc(openSourceCatalog.stars));
      return result;
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(openSourceCatalog)
        .where(eq(openSourceCatalog.id, input.id))
        .limit(1);
      return result[0] || null;
    }),

  search: publicQuery
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const all = await db
        .select()
        .from(openSourceCatalog)
        .where(eq(openSourceCatalog.isActive, true));

      const query = input.query.toLowerCase();
      return all.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          (item.tags && (item.tags as string[]).some((tag) => tag.toLowerCase().includes(query)))
      );
    }),

  create: authedMutation
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string(),
        githubUrl: z.string().url(),
        documentationUrl: z.string().url().optional(),
        demoUrl: z.string().url().optional(),
        category: z.enum([
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
        ]),
        language: z.string().optional(),
        stars: z.number().default(0),
        license: z.string().optional(),
        version: z.string().optional(),
        features: z.array(z.string()).optional(),
        installation: z.string().optional(),
        usage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isFeatured: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const result = await db.insert(openSourceCatalog).values({
        name: input.name,
        description: input.description,
        githubUrl: input.githubUrl,
        documentationUrl: input.documentationUrl,
        demoUrl: input.demoUrl,
        category: input.category,
        language: input.language,
        stars: input.stars,
        license: input.license,
        version: input.version,
        features: input.features as any,
        installation: input.installation,
        usage: input.usage,
        tags: input.tags as any,
        isFeatured: input.isFeatured,
      });
      return { id: Number(result[0].insertId) };
    }),

  seedCatalog: authedMutation.mutation(async () => {
    const catalogItems = [
      {
        name: "OpenClaw",
        description: "Assistente pessoal de IA open-source multi-canal. Gateway local que conecta modelos de IA a mais de 50 integracoes incluindo WhatsApp, Telegram, Slack, Discord e iMessage. Roda 24/7 no seu hardware com memoria persistente e capacidade de agir proativamente.",
        githubUrl: "https://github.com/openclaw/openclaw",
        documentationUrl: "https://openclaw.ai/docs",
        demoUrl: "https://openclaw.ai",
        category: "agent_framework" as const,
        language: "TypeScript",
        stars: 210000,
        license: "MIT",
        version: "2.0",
        features: ["Multi-channel", "Local execution", "Persistent memory", "Skill system", "Browser automation"],
        tags: ["agent", "assistant", "automation", "local-ai"],
        isFeatured: true,
      },
      {
        name: "DeepSeek-V3",
        description: "Modelo de linguagem open-source de ultima geracao com arquitetura Mixture-of-Experts (MoE). Performance comparavel a modelos proprietarios com suporte a contexto de 128K tokens.",
        githubUrl: "https://github.com/deepseek-ai/DeepSeek-V3",
        documentationUrl: "https://deepseek.ai/docs",
        category: "llm" as const,
        language: "Python",
        stars: 100000,
        license: "MIT",
        version: "3.0",
        features: ["MoE architecture", "128K context", "Multilingual", "Reasoning"],
        tags: ["llm", "moe", "reasoning", "open-source"],
        isFeatured: true,
      },
      {
        name: "Ollama",
        description: "Framework leve e extensivel para executar modelos de linguagem localmente. Facilita o download, configuracao e execucao de modelos como Llama, Mistral, e outros diretamente no seu hardware.",
        githubUrl: "https://github.com/ollama/ollama",
        documentationUrl: "https://ollama.ai/docs",
        demoUrl: "https://ollama.ai",
        category: "inference" as const,
        language: "Go",
        stars: 160000,
        license: "MIT",
        version: "0.5",
        features: ["Local inference", "Model management", "REST API", "Multi-platform"],
        tags: ["local-ai", "inference", "llm", "deployment"],
        isFeatured: true,
      },
      {
        name: "RAGFlow",
        description: "Motor open-source para Retrieval-Augmented Generation que combina RAG de ponta com capacidades de agentes. Fornece ingestao de documentos, indexacao vetorial e agentes de busca.",
        githubUrl: "https://github.com/infiniflow/ragflow",
        documentationUrl: "https://ragflow.io/docs",
        category: "rag" as const,
        language: "Python",
        stars: 70000,
        license: "Apache-2.0",
        version: "0.15",
        features: ["Document ingestion", "Vector indexing", "Agent search", "Citation tracking"],
        tags: ["rag", "vector-search", "documents", "agents"],
        isFeatured: true,
      },
      {
        name: "Khoj",
        description: "Assistente pessoal de IA open-source que escala de dispositivo local a nuvem empresarial. Usa RAG para ler arquivos pessoais e responde perguntas com conhecimento do usuario.",
        githubUrl: "https://github.com/khoj-ai/khoj",
        documentationUrl: "https://docs.khoj.dev",
        demoUrl: "https://app.khoj.dev",
        category: "agent_framework" as const,
        language: "Python",
        stars: 25000,
        license: "AGPL-3.0",
        version: "1.0",
        features: ["Personal AI", "RAG", "Multi-platform", "Semantic search"],
        tags: ["assistant", "rag", "knowledge", "search"],
      },
      {
        name: "Open-R1",
        description: "Reproducao open-source completa do pipeline DeepSeek-R1. Inclui treinamento GRPO, fine-tuning SFT, geracao de dados sinteticos e avaliacao.",
        githubUrl: "https://github.com/huggingface/open-r1",
        documentationUrl: "https://huggingface.co/docs/open-r1",
        category: "training" as const,
        language: "Python",
        stars: 35000,
        license: "Apache-2.0",
        version: "0.1",
        features: ["GRPO training", "SFT", "Synthetic data", "Evaluation"],
        tags: ["training", "reasoning", "deepseek", "rl"],
      },
      {
        name: "Langflow",
        description: "Plataforma low-code para construir e deployar agentes de IA e workflows RAG. Interface visual drag-and-drop baseada em LangChain.",
        githubUrl: "https://github.com/langflow-ai/langflow",
        documentationUrl: "https://docs.langflow.org",
        demoUrl: "https://langflow.org",
        category: "workflow" as const,
        language: "Python",
        stars: 140000,
        license: "MIT",
        version: "1.0",
        features: ["Visual builder", "RAG workflows", "Multi-LLM", "API deploy"],
        tags: ["workflow", "langchain", "visual", "rag"],
      },
      {
        name: "Dify",
        description: "Plataforma completa para construir e gerenciar aplicacoes de IA. Suporta chatbots, agentes, RAG e monitoramento com deploy local ou em nuvem.",
        githubUrl: "https://github.com/langgenius/dify",
        documentationUrl: "https://docs.dify.ai",
        demoUrl: "https://dify.ai",
        category: "agent_framework" as const,
        language: "TypeScript",
        stars: 120000,
        license: "Apache-2.0",
        version: "0.15",
        features: [ "LLM apps", "Chatbots", "RAG", "Workflows", "Monitoring" ],
        tags: [ "platform", "llm", "rag", "agents" ],
      },
      {
        name: "Milvus",
        description: "Banco de dados vetorial de alta performance para busca por similaridade. Arquitetura cloud-native com suporte a bilhoes de vetores.",
        githubUrl: "https://github.com/milvus-io/milvus",
        documentationUrl: "https://milvus.io/docs",
        demoUrl: "https://milvus.io",
        category: "vector_database" as const,
        language: "Go",
        stars: 32000,
        license: "Apache-2.0",
        version: "2.4",
        features: [ "Billion-scale", "GPU acceleration", "Hybrid search", "Cloud-native" ],
        tags: [ "vector-db", "search", "embeddings", "cloud" ],
      },
      {
        name: "n8n",
        description: "Plataforma de automacao de workflows com IA nativa. 400+ integracoes com interface visual e suporte a agentes de IA.",
        githubUrl: "https://github.com/n8n-io/n8n",
        documentationUrl: "https://docs.n8n.io",
        demoUrl: "https://n8n.io",
        category: "workflow" as const,
        language: "TypeScript",
        stars: 160000,
        license: "Fair-code",
        version: "1.0",
        features: [ "400+ integrations", "AI agents", "Visual builder", "Self-hosted" ],
        tags: [ "automation", "workflow", "integration", "ai" ],
      },
      {
        name: "LightRAG",
        description: "Framework RAG simplificado e rapido. Aceito no EMNLP 2025, foca em simplicidade e velocidade para tecnicas avancadas de RAG.",
        githubUrl: "https://github.com/HKUDS/LightRAG",
        documentationUrl: "https://lightrag.github.io",
        category: "rag" as const,
        language: "Python",
        stars: 25000,
        license: "MIT",
        version: "1.0",
        features: [ "Fast indexing", "Graph-based", "Multi-modal", "Easy setup" ],
        tags: [ "rag", "graph", "lightweight", "fast" ],
      },
      {
        name: "Claude Code",
        description: "Ferramenta de codificacao agentica da Anthropic que vive no terminal. Integra Claude com o workflow de desenvolvimento local.",
        githubUrl: "https://github.com/anthropics/claude-code",
        documentationUrl: "https://docs.anthropic.com/claude-code",
        category: "tool" as const,
        language: "TypeScript",
        stars: 46000,
        license: "MIT",
        version: "0.1",
        features: [ "Terminal-based", "Code understanding", "Git integration", "Autonomous" ],
        tags: [ "coding", "terminal", "agent", "claude" ],
      },
      {
        name: "Memori",
        description: "Motor de memoria open-source para sistemas de IA. Suporta LLMs, agentes e sistemas multi-agentes com persistencia de contexto.",
        githubUrl: "https://github.com/memori-ai/memori",
        documentationUrl: "https://docs.memori.ai",
        category: "memory" as const,
        language: "Python",
        stars: 8700,
        license: "MIT",
        version: "0.5",
        features: [ "Persistent memory", "Multi-agent", "Context-aware", "Scalable" ],
        tags: [ "memory", "agents", "context", "scalable" ],
      },
      {
        name: "STORM",
        description: "Sistema de IA colaborativa para exploracao de conhecimento. Gera artigos estilo Wikipedia com pesquisa e questionamento multi-perspectiva.",
        githubUrl: "https://github.com/stanford-oval/storm",
        documentationUrl: "https://storm.genie.stanford.edu",
        category: "tool" as const,
        language: "Python",
        stars: 22000,
        license: "MIT",
        version: "1.0",
        features: [ "Article generation", "Multi-perspective", "Citation", "Co-STORM" ],
        tags: [ "research", "writing", "knowledge", "stanford" ],
      },
      {
        name: "Browser Use",
        description: "Automacao de navegador usando agentes de IA. Alternativa open-source para automacao web com execucao local e privacidade.",
        githubUrl: "https://github.com/browser-use/browser-use",
        documentationUrl: "https://browser-use.com/docs",
        category: "tool" as const,
        language: "Python",
        stars: 45000,
        license: "MIT",
        version: "0.1",
        features: [ "Web automation", "Local execution", "Privacy-focused", "Extensible" ],
        tags: [ "browser", "automation", "privacy", "agent" ],
      },
      {
        name: "vLLM",
        description: "Motor de inferencia de alta performance para LLMs. Otimizado para throughput com PagedAttention e suporte a multi-GPU.",
        githubUrl: "https://github.com/vllm-project/vllm",
        documentationUrl: "https://docs.vllm.ai",
        category: "inference" as const,
        language: "Python",
        stars: 45000,
        license: "Apache-2.0",
        version: "0.6",
        features: [ "PagedAttention", "Multi-GPU", "High throughput", "OpenAI-compatible API" ],
        tags: [ "inference", "gpu", "serving", "llm" ],
      },
      {
        name: "Qdrant",
        description: "Banco de dados vetorial de alta performance para aplicacoes de IA. Escrito em Rust com suporte a filtragem hibrida.",
        githubUrl: "https://github.com/qdrant/qdrant",
        documentationUrl: "https://qdrant.tech/docs",
        demoUrl: "https://qdrant.tech",
        category: "vector_database" as const,
        language: "Rust",
        stars: 23000,
        license: "Apache-2.0",
        version: "1.12",
        features: [ "Hybrid search", "Filtering", "Rust-based", "Cloud-native" ],
        tags: [ "vector-db", "rust", "search", "embeddings" ],
      },
      {
        name: "Unsloth",
        description: "Framework de fine-tuning 2-5x mais rapido com 70% menos memoria. Otimizado para treinar LLMs com LoRA e QLoRA.",
        githubUrl: "https://github.com/unslothai/unsloth",
        documentationUrl: "https://docs.unsloth.ai",
        category: "training" as const,
        language: "Python",
        stars: 28000,
        license: "Apache-2.0",
        version: "2024.12",
        features: [ "2-5x faster", "70% less memory", "LoRA", "QLoRA" ],
        tags: [ "training", "fine-tuning", "lora", "efficient" ],
      },
      {
        name: "AutoGen",
        description: "Framework multi-agente da Microsoft para construir aplicacoes de IA. Agentes conversacionais que podem colaborar para resolver tarefas complexas.",
        githubUrl: "https://github.com/microsoft/autogen",
        documentationUrl: "https://microsoft.github.io/autogen",
        category: "agent_framework" as const,
        language: "Python",
        stars: 42000,
        license: "MIT",
        version: "0.4",
        features: [ "Multi-agent", "Conversational", "Code execution", "Human-in-loop" ],
        tags: [ "agents", "microsoft", "multi-agent", "framework" ],
      },
      {
        name: "Weaviate",
        description: "Banco de dados vetorial com busca semantica nativa. Suporta objetos vetoriais e modulos de IA integrados.",
        githubUrl: "https://github.com/weaviate/weaviate",
        documentationUrl: "https://weaviate.io/developers",
        demoUrl: "https://weaviate.io",
        category: "vector_database" as const,
        language: "Go",
        stars: 12000,
        license: "BSD-3-Clause",
        version: "1.27",
        features: [ "Semantic search", "Modular AI", "GraphQL", "Cloud-native" ],
        tags: [ "vector-db", "graphql", "semantic", "cloud" ],
      },
    ];

    for (const item of catalogItems) {
      await db.insert(openSourceCatalog).values(item);
    }

    return { count: catalogItems.length };
  }),
});
