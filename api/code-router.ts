import { z } from "zod";
import { createRouter, publicQuery, authedQuery, authedMutation } from "./middleware";
import { codeAssistant } from "./services/code-assistant";
import { db } from "./queries/connection";
import { codeProjects } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

export const codeRouter = createRouter({
  generate: authedMutation
    .input(
      z.object({
        description: z.string().min(1),
        language: z.string().min(1),
        framework: z.string().optional(),
        type: z.enum(["function", "class", "component", "api", "script", "test", "full_app"]).default("function"),
        context: z.string().optional(),
        requirements: z.array(z.string()).optional(),
        modelId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await codeAssistant.generateCode({
        description: input.description,
        language: input.language,
        framework: input.framework,
        type: input.type,
        context: input.context,
        requirements: input.requirements,
        modelId: input.modelId,
      });
      return result;
    }),

  analyze: authedMutation
    .input(
      z.object({
        code: z.string().min(1),
        language: z.string().min(1),
        analysisType: z.enum(["review", "explain", "optimize", "debug", "document", "refactor", "security"]),
        context: z.string().optional(),
        modelId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await codeAssistant.analyzeCode({
        code: input.code,
        language: input.language,
        analysisType: input.analysisType,
        context: input.context,
        modelId: input.modelId,
      });
      return result;
    }),

  fix: authedMutation
    .input(
      z.object({
        code: z.string().min(1),
        error: z.string().min(1),
        language: z.string().min(1),
        modelId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await codeAssistant.fixCode(
        input.code,
        input.error,
        input.language,
        input.modelId
      );
      return { code: result };
    }),

  generateTests: authedMutation
    .input(
      z.object({
        code: z.string().min(1),
        language: z.string().min(1),
        framework: z.string().optional(),
        modelId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await codeAssistant.generateTests(
        input.code,
        input.language,
        input.framework,
        input.modelId
      );
      return { code: result };
    }),

  refactor: authedMutation
    .input(
      z.object({
        code: z.string().min(1),
        instruction: z.string().min(1),
        language: z.string().min(1),
        modelId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await codeAssistant.refactorCode(
        input.code,
        input.instruction,
        input.language,
        input.modelId
      );
      return result;
    }),

  convert: authedMutation
    .input(
      z.object({
        code: z.string().min(1),
        fromLang: z.string().min(1),
        toLang: z.string().min(1),
        modelId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await codeAssistant.convertCode(
        input.code,
        input.fromLang,
        input.toLang,
        input.modelId
      );
      return { code: result };
    }),

  document: authedMutation
    .input(
      z.object({
        code: z.string().min(1),
        language: z.string().min(1),
        modelId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await codeAssistant.generateDocumentation(
        input.code,
        input.language,
        input.modelId
      );
      return { documentation: result };
    }),

  generateProject: authedMutation
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        type: z.string().min(1),
        language: z.string().min(1),
        framework: z.string().optional(),
        features: z.array(z.string()).optional(),
        modelId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await codeAssistant.generateProject({
        name: input.name,
        description: input.description,
        type: input.type,
        language: input.language,
        framework: input.framework,
        features: input.features,
        modelId: input.modelId,
      });
      return result;
    }),

  listLanguages: publicQuery.query(() => {
    return codeAssistant.getSupportedLanguages();
  }),

  listProjects: authedQuery.query(async ({ ctx }) => {
    const result = await db
      .select()
      .from(codeProjects)
      .where(eq(codeProjects.userId, ctx.user.id))
      .orderBy(desc(codeProjects.updatedAt));
    return result;
  }),

  getProject: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(codeProjects)
        .where(and(eq(codeProjects.id, input.id), eq(codeProjects.userId, ctx.user.id)))
        .limit(1);
      return result[0] || null;
    }),

  createProject: authedMutation
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string(),
        language: z.string(),
        framework: z.string().optional(),
        type: z.string().default("web_app"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await db.insert(codeProjects).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        language: input.language,
        framework: input.framework,
        type: input.type as "web_app" | "api" | "cli" | "library" | "script" | "mobile_app" | "desktop_app" | "game" | "ml_model" | "data_pipeline" | "automation" | "other",
        status: "planning",
      });
      return { id: Number(result[0].insertId) };
    }),

  updateProject: authedMutation
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        files: z.any().optional(),
        codeSnippets: z.any().optional(),
        documentation: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db
        .update(codeProjects)
        .set({
          ...data,
          updatedAt: new Date(),
        } as any)
        .where(and(eq(codeProjects.id, id), eq(codeProjects.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteProject: authedMutation
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(codeProjects)
        .where(and(eq(codeProjects.id, input.id), eq(codeProjects.userId, ctx.user.id)));
      return { success: true };
    }),
});
