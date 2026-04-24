import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { knowledgeBases, documents } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

export const knowledgeRouter = createRouter({
  listBases: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.knowledgeBases.findMany({
      where: eq(knowledgeBases.userId, ctx.user.id),
      orderBy: desc(knowledgeBases.updatedAt),
    });
  }),

  baseById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const base = await db.query.knowledgeBases.findFirst({
        where: and(eq(knowledgeBases.id, input.id), eq(knowledgeBases.userId, ctx.user.id)),
      });
      if (!base) return null;
      const docs = await db.query.documents.findMany({
        where: eq(documents.knowledgeBaseId, input.id),
        orderBy: desc(documents.createdAt),
      });
      return { ...base, documents: docs };
    }),

  createBase: authedQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      embeddingModel: z.string().default("nomic-embed-text"),
      vectorStore: z.enum(["chromadb", "qdrant", "weaviate", "milvus", "pgvector"]).default("chromadb"),
      chunkSize: z.number().default(512),
      chunkOverlap: z.number().default(50),
      isPublic: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(knowledgeBases).values({
        ...input,
        userId: ctx.user.id,
      }).$returningId();
      return result;
    }),

  updateBase: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      chunkSize: z.number().optional(),
      chunkOverlap: z.number().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(knowledgeBases)
        .set(data)
        .where(and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteBase: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(documents).where(eq(documents.knowledgeBaseId, input.id));
      await db.delete(knowledgeBases).where(
        and(eq(knowledgeBases.id, input.id), eq(knowledgeBases.userId, ctx.user.id))
      );
      return { success: true };
    }),

  addDocument: authedQuery
    .input(z.object({
      knowledgeBaseId: z.number(),
      name: z.string().min(1),
      source: z.string().optional(),
      content: z.string().min(1),
      mimeType: z.string().optional(),
      size: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const base = await db.query.knowledgeBases.findFirst({
        where: and(
          eq(knowledgeBases.id, input.knowledgeBaseId),
          eq(knowledgeBases.userId, ctx.user.id)
        ),
      });
      if (!base) throw new Error("Knowledge base not found");

      const [doc] = await db.insert(documents).values({
        ...input,
        status: "indexed",
        chunkCount: Math.ceil(input.content.length / (base.chunkSize ?? 512)),
      });

      await db.update(knowledgeBases)
        .set({ documentCount: (base.documentCount ?? 0) + 1 })
        .where(eq(knowledgeBases.id, input.knowledgeBaseId));

      return doc;
    }),

  deleteDocument: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, input.id),
      });
      if (!doc) throw new Error("Document not found");

      const base = await db.query.knowledgeBases.findFirst({
        where: and(eq(knowledgeBases.id, doc.knowledgeBaseId), eq(knowledgeBases.userId, ctx.user.id)),
      });
      if (!base) throw new Error("Unauthorized");

      await db.delete(documents).where(eq(documents.id, input.id));
      await db.update(knowledgeBases)
        .set({ documentCount: Math.max(0, (base.documentCount ?? 0) - 1) })
        .where(eq(knowledgeBases.id, base.id));

      return { success: true };
    }),

  queryRag: authedQuery
    .input(z.object({
      knowledgeBaseId: z.number(),
      query: z.string().min(1),
      topK: z.number().default(5),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const base = await db.query.knowledgeBases.findFirst({
        where: and(
          eq(knowledgeBases.id, input.knowledgeBaseId),
          eq(knowledgeBases.userId, ctx.user.id)
        ),
      });
      if (!base) throw new Error("Knowledge base not found");

      const docs = await db.query.documents.findMany({
        where: and(eq(documents.knowledgeBaseId, input.knowledgeBaseId), eq(documents.status, "indexed")),
      });

      const keywords = input.query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const scored = docs.map(doc => {
        const text = (doc.content ?? "").toLowerCase();
        const score = keywords.reduce((sum, kw) => sum + (text.includes(kw) ? 1 : 0), 0);
        return { ...doc, score };
      }).sort((a, b) => b.score - a.score).slice(0, input.topK);

      const context = scored.map(d => `[${d.name}]: ${(d.content ?? "").slice(0, 800)}`).join("\n\n");
      const response = `[RAG MOCK] Knowledge Base: ${base.name} | Query: ${input.query} | Documents matched: ${scored.length} | Vector store: ${base.vectorStore} | Embedding: ${base.embeddingModel} | Context length: ${context.length} chars | In production, integrate with ChromaDB, Qdrant, or pgvector for semantic search.`;

      return { results: scored, context, response };
    }),
});
