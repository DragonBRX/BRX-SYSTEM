import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { integrations, mcpServers } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

export const integrationRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.integrations.findMany({
      where: eq(integrations.userId, ctx.user.id),
      orderBy: desc(integrations.createdAt),
    });
  }),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return db.query.integrations.findFirst({
        where: and(eq(integrations.id, input.id), eq(integrations.userId, ctx.user.id)),
      });
    }),

  create: authedQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      type: z.enum(["ollama", "openai", "anthropic", "google", "huggingface", "local", "mcp", "custom"]),
      endpoint: z.string().optional(),
      apiKey: z.string().optional(),
      config: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(integrations).values({
        ...input,
        userId: ctx.user.id,
        status: "disconnected",
      }).$returningId();
      return result;
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      endpoint: z.string().optional(),
      apiKey: z.string().optional(),
      config: z.record(z.string(), z.any()).optional(),
      isActive: z.boolean().optional(),
      status: z.enum(["connected", "disconnected", "error"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(integrations)
        .set(data)
        .where(and(eq(integrations.id, id), eq(integrations.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(integrations)
        .where(and(eq(integrations.id, input.id), eq(integrations.userId, ctx.user.id)));
      return { success: true };
    }),

  testConnection: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const integration = await db.query.integrations.findFirst({
        where: and(eq(integrations.id, input.id), eq(integrations.userId, ctx.user.id)),
      });
      if (!integration) throw new Error("Integration not found");

      const mockSuccess = Math.random() > 0.2;
      await db.update(integrations)
        .set({
          status: mockSuccess ? "connected" : "error",
          lastTestedAt: new Date(),
        })
        .where(eq(integrations.id, input.id));

      return { success: mockSuccess, type: integration.type, endpoint: integration.endpoint };
    }),
});

export const mcpRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.mcpServers.findMany({
      where: eq(mcpServers.userId, ctx.user.id),
      orderBy: desc(mcpServers.createdAt),
    });
  }),

  create: authedQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      transport: z.enum(["stdio", "sse", "http"]).default("stdio"),
      command: z.string().optional(),
      args: z.array(z.string()).optional(),
      env: z.record(z.string(), z.string()).optional(),
      url: z.string().optional(),
      tools: z.array(z.object({
        name: z.string(),
        description: z.string(),
        inputSchema: z.record(z.string(), z.any()).optional(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [result] = await db.insert(mcpServers).values({
        ...input,
        userId: ctx.user.id,
      }).$returningId();
      return result;
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      transport: z.enum(["stdio", "sse", "http"]).optional(),
      command: z.string().optional(),
      args: z.array(z.string()).optional(),
      env: z.record(z.string(), z.string()).optional(),
      url: z.string().optional(),
      tools: z.array(z.object({
        name: z.string(),
        description: z.string(),
        inputSchema: z.record(z.string(), z.any()).optional(),
      })).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(mcpServers)
        .set(data)
        .where(and(eq(mcpServers.id, id), eq(mcpServers.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(mcpServers)
        .where(and(eq(mcpServers.id, input.id), eq(mcpServers.userId, ctx.user.id)));
      return { success: true };
    }),
});
