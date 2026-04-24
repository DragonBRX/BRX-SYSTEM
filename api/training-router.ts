import { z } from "zod";
import { createRouter, authedQuery, authedMutation } from "./middleware";
import { db } from "./queries/connection";
import { trainingJobs, datasets } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

export const trainingRouter = createRouter({
  listJobs: authedQuery.query(async ({ ctx }) => {
    const result = await db
      .select()
      .from(trainingJobs)
      .where(eq(trainingJobs.userId, ctx.user.id))
      .orderBy(desc(trainingJobs.createdAt));
    return result;
  }),

  getJob: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(trainingJobs)
        .where(and(eq(trainingJobs.id, input.id), eq(trainingJobs.userId, ctx.user.id)))
        .limit(1);
      return result[0] || null;
    }),

  createJob: authedMutation
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        baseModel: z.string().min(1),
        trainingType: z.enum([
          "fine_tuning",
          "rlhf",
          "dpo",
          "distillation",
          "pretraining",
          "continuation",
          "grpo",
          "sft",
          "lora",
          "qlora",
        ]),
        datasetId: z.number().optional(),
        hyperparameters: z.record(z.any()).optional(),
        gpuType: z.string().optional(),
        gpuCount: z.number().min(1).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await db.insert(trainingJobs).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        baseModel: input.baseModel,
        trainingType: input.trainingType,
        datasetId: input.datasetId,
        hyperparameters: input.hyperparameters as any,
        gpuType: input.gpuType,
        gpuCount: input.gpuCount,
        status: "queued",
        progress: 0,
      });
      return { id: Number(result[0].insertId) };
    }),

  updateJob: authedMutation
    .input(
      z.object({
        id: z.number(),
        status: z.string().optional(),
        progress: z.number().optional(),
        currentEpoch: z.number().optional(),
        currentStep: z.number().optional(),
        loss: z.number().optional(),
        learningRate: z.number().optional(),
        evalResults: z.any().optional(),
        logs: z.string().optional(),
        errorMessage: z.string().optional(),
        outputModelUrl: z.string().optional(),
        huggingfaceRepo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db
        .update(trainingJobs)
        .set({
          ...data,
          updatedAt: new Date(),
        } as any)
        .where(and(eq(trainingJobs.id, id), eq(trainingJobs.userId, ctx.user.id)));
      return { success: true };
    }),

  cancelJob: authedMutation
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(trainingJobs)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(and(eq(trainingJobs.id, input.id), eq(trainingJobs.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteJob: authedMutation
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(trainingJobs)
        .where(and(eq(trainingJobs.id, input.id), eq(trainingJobs.userId, ctx.user.id)));
      return { success: true };
    }),

  listDatasets: authedQuery.query(async ({ ctx }) => {
    const result = await db
      .select()
      .from(datasets)
      .where(eq(datasets.userId, ctx.user.id))
      .orderBy(desc(datasets.createdAt));
    return result;
  }),

  getDataset: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(datasets)
        .where(and(eq(datasets.id, input.id), eq(datasets.userId, ctx.user.id)))
        .limit(1);
      return result[0] || null;
    }),

  createDataset: authedMutation
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        type: z.enum([
          "text",
          "conversation",
          "code",
          "instruction",
          "preference",
          "synthetic",
          "multimodal",
          "embedding",
          "classification",
          "qa",
        ]),
        format: z.enum(["jsonl", "csv", "parquet", "json", "txt", "huggingface"]).default("jsonl"),
        source: z.string().optional(),
        huggingfaceDataset: z.string().optional(),
        recordCount: z.number().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await db.insert(datasets).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        type: input.type,
        format: input.format,
        source: input.source,
        huggingfaceDataset: input.huggingfaceDataset,
        recordCount: input.recordCount,
        tags: input.tags as any,
      });
      return { id: Number(result[0].insertId) };
    }),

  updateDataset: authedMutation
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        recordCount: z.number().optional(),
        preprocessing: z.any().optional(),
        quality: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db
        .update(datasets)
        .set({
          ...data,
          updatedAt: new Date(),
        } as any)
        .where(and(eq(datasets.id, id), eq(datasets.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteDataset: authedMutation
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(datasets)
        .where(and(eq(datasets.id, input.id), eq(datasets.userId, ctx.user.id)));
      return { success: true };
    }),
});
