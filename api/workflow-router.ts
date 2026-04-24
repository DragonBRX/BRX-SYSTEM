import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { workflows } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

export const workflowRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.workflows.findMany({
      where: eq(workflows.userId, ctx.user.id),
      orderBy: desc(workflows.updatedAt),
    });
  }),

  publicList: authedQuery.query(async () => {
    const db = getDb();
    return db.query.workflows.findMany({
      where: eq(workflows.isPublic, true),
      orderBy: desc(workflows.runCount),
    });
  }),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return db.query.workflows.findFirst({
        where: and(eq(workflows.id, input.id), eq(workflows.userId, ctx.user.id)),
      });
    }),

  create: authedQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      nodes: z.array(z.record(z.string(), z.any())).default([]),
      edges: z.array(z.record(z.string(), z.any())).default([]),
      triggerType: z.enum(["manual", "scheduled", "webhook", "event"]).default("manual"),
      cronExpression: z.string().optional(),
      isPublic: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(workflows).values({
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
      nodes: z.array(z.record(z.string(), z.any())).optional(),
      edges: z.array(z.record(z.string(), z.any())).optional(),
      triggerType: z.enum(["manual", "scheduled", "webhook", "event"]).optional(),
      cronExpression: z.string().optional(),
      isPublic: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(workflows)
        .set(data)
        .where(and(eq(workflows.id, id), eq(workflows.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(workflows)
        .where(and(eq(workflows.id, input.id), eq(workflows.userId, ctx.user.id)));
      return { success: true };
    }),

  run: authedQuery
    .input(z.object({
      id: z.number(),
      inputData: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const wf = await db.query.workflows.findFirst({
        where: and(eq(workflows.id, input.id), eq(workflows.userId, ctx.user.id)),
      });
      if (!wf) throw new Error("Workflow not found");

      await db.update(workflows)
        .set({
          runCount: (wf.runCount ?? 0) + 1,
          lastRunAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(workflows.id, input.id));

      const response = `[WORKFLOW RUN MOCK] Workflow: ${wf.name} | Nodes: ${(wf.nodes as any[])?.length ?? 0} | Edges: ${(wf.edges as any[])?.length ?? 0} | Trigger: ${wf.triggerType} | Input: ${JSON.stringify(input.inputData ?? {}).slice(0, 200)} | This is a simulated workflow execution. In production, integrate with LangGraph, Prefect, or custom DAG engine.`;

      return { response, workflowId: wf.id };
    }),
});
