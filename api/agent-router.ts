import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { agents } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

export const agentRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.agents.findMany({
      where: eq(agents.userId, ctx.user.id),
      orderBy: desc(agents.updatedAt),
    });
  }),

  publicList: authedQuery.query(async () => {
    const db = getDb();
    return db.query.agents.findMany({
      where: eq(agents.isPublic, true),
      orderBy: desc(agents.runCount),
    });
  }),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return db.query.agents.findFirst({
        where: and(
          eq(agents.id, input.id),
          eq(agents.userId, ctx.user.id)
        ),
      });
    }),

  create: authedQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      systemPrompt: z.string().min(1),
      modelId: z.string(),
      temperature: z.number().min(0).max(2).default(0.7),
      maxTokens: z.number().min(1).max(65536).default(2048),
      tools: z.array(z.object({
        name: z.string(),
        description: z.string(),
        parameters: z.record(z.string(), z.any()).optional(),
      })).optional(),
      memoryEnabled: z.boolean().default(true),
      memoryWindow: z.number().default(10),
      knowledgeBaseIds: z.array(z.number()).optional(),
      isPublic: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(agents).values({
        ...input,
        userId: ctx.user.id,
      }).$returningId();
      return result;
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      systemPrompt: z.string().optional(),
      modelId: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().optional(),
      tools: z.array(z.object({
        name: z.string(),
        description: z.string(),
        parameters: z.record(z.string(), z.any()).optional(),
      })).optional(),
      memoryEnabled: z.boolean().optional(),
      knowledgeBaseIds: z.array(z.number()).optional(),
      isPublic: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(agents)
        .set(data)
        .where(and(eq(agents.id, id), eq(agents.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(agents)
        .where(and(eq(agents.id, input.id), eq(agents.userId, ctx.user.id)));
      return { success: true };
    }),

  run: authedQuery
    .input(z.object({
      id: z.number(),
      input: z.string().min(1),
      context: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const agent = await db.query.agents.findFirst({
        where: and(eq(agents.id, input.id), eq(agents.userId, ctx.user.id)),
      });
      if (!agent) throw new Error("Agent not found");

      await db.update(agents)
        .set({ runCount: (agent.runCount ?? 0) + 1, updatedAt: new Date() })
        .where(eq(agents.id, input.id));

      const response = `[AGENT RUN MOCK] Agent: ${agent.name} | Input: ${input.input.slice(0, 100)}... | System: ${agent.systemPrompt.slice(0, 100)}... | Model: ${agent.modelId} | Memory: ${agent.memoryEnabled ? "enabled" : "disabled"} | Tools: ${(agent.tools as any[])?.length ?? 0} | This is a simulated agent execution. In production, integrate with LangChain, LangGraph, or custom orchestration.`;

      return { response, agentId: agent.id };
    }),
});
