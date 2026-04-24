import { z } from "zod";
import { createRouter, publicQuery, authedQuery, authedMutation } from "./middleware";
import { storyEngine } from "./services/story-engine";
import { db } from "./queries/connection";
import { stories } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

export const storyRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const result = await db
      .select()
      .from(stories)
      .where(eq(stories.userId, ctx.user.id))
      .orderBy(desc(stories.updatedAt));
    return result;
  }),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(stories)
        .where(and(eq(stories.id, input.id), eq(stories.userId, ctx.user.id)))
        .limit(1);
      return result[0] || null;
    }),

  create: authedMutation
    .input(
      z.object({
        title: z.string().min(1).max(255),
        genre: z.string(),
        tone: z.string(),
        targetAudience: z.string(),
        premise: z.string().optional(),
        setting: z.string().optional(),
        mainCharacters: z.string().optional(),
        targetWordCount: z.number().min(100).max(100000).default(5000),
        chapterCount: z.number().min(1).max(50).default(5),
        language: z.string().default("pt-BR"),
        modelId: z.string().optional(),
        temperature: z.number().min(0).max(2).default(0.8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await db.insert(stories).values({
        userId: ctx.user.id,
        title: input.title,
        genre: input.genre as "fantasy" | "sci_fi" | "horror" | "romance" | "mystery" | "thriller" | "adventure" | "historical" | "drama" | "comedy" | "dystopian" | "cyberpunk" | "steampunk" | "supernatural" | "noir" | "custom",
        tone: input.tone as "dark" | "light" | "humorous" | "serious" | "epic" | "intimate" | "suspenseful" | "whimsical" | "gritty" | "inspirational",
        targetAudience: input.targetAudience as "children" | "young_adult" | "adult" | "all_ages",
        premise: input.premise,
        setting: input.setting,
        targetWordCount: input.targetWordCount,
        chapterCount: input.chapterCount,
        language: input.language,
        modelId: input.modelId,
        temperature: input.temperature,
        status: "draft",
      });

      return { id: Number(result[0].insertId) };
    }),

  generateOutline: authedMutation
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const story = await db
        .select()
        .from(stories)
        .where(and(eq(stories.id, input.id), eq(stories.userId, ctx.user.id)))
        .limit(1);

      if (!story[0]) throw new Error("Story not found");

      const outline = await storyEngine.generateOutline({
        title: story[0].title,
        genre: story[0].genre,
        tone: story[0].tone,
        targetAudience: story[0].targetAudience,
        premise: story[0].premise || undefined,
        setting: story[0].setting || undefined,
        targetWordCount: story[0].targetWordCount || 5000,
        chapterCount: story[0].chapterCount || 5,
        language: story[0].language || "pt-BR",
        modelId: story[0].modelId || undefined,
        temperature: story[0].temperature || undefined,
      });

      await db
        .update(stories)
        .set({
          premise: outline.premise,
          setting: outline.setting,
          mainCharacters: outline.characters as any,
          plotOutline: outline.chapters as any,
          status: "in_progress",
          updatedAt: new Date(),
        })
        .where(eq(stories.id, input.id));

      return outline;
    }),

  generateChapter: authedMutation
    .input(
      z.object({
        id: z.number(),
        chapterNumber: z.number().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const story = await db
        .select()
        .from(stories)
        .where(and(eq(stories.id, input.id), eq(stories.userId, ctx.user.id)))
        .limit(1);

      if (!story[0]) throw new Error("Story not found");

      const chapters = (story[0].chapters || []) as Array<{
        number: number;
        title: string;
        summary: string;
        scenes: Array<{ title: string; setting: string; characters: string[]; summary: string }>;
        content?: string;
      }>;

      const outline = {
        title: story[0].title,
        premise: story[0].premise || "",
        setting: story[0].setting || "",
        themes: [],
        characters: (story[0].mainCharacters || []) as Array<{
          name: string;
          description: string;
          role: string;
          traits: string[];
        }>,
        chapters: chapters.map((c) => ({
          number: c.number,
          title: c.title,
          summary: c.summary,
          scenes: c.scenes || [],
        })),
        targetWordCount: story[0].targetWordCount || 5000,
        estimatedChapters: story[0].chapterCount || 5,
      };

      const previousChapters = chapters
        .filter((c) => c.number < input.chapterNumber && c.content)
        .map((c) => `Capitulo ${c.number}: ${c.title}`);

      const generated = await storyEngine.generateChapter(
        outline,
        input.chapterNumber,
        previousChapters,
        story[0].modelId || undefined,
        story[0].temperature || undefined
      );

      const updatedChapters = chapters.map((c) =>
        c.number === input.chapterNumber
          ? { ...c, content: generated.content, wordCount: generated.wordCount }
          : c
      );

      const totalWordCount = updatedChapters.reduce(
        (sum, c) => sum + (c.wordCount || 0),
        0
      );

      await db
        .update(stories)
        .set({
          chapters: updatedChapters as any,
          wordCount: totalWordCount,
          currentChapter: input.chapterNumber,
          updatedAt: new Date(),
        })
        .where(eq(stories.id, input.id));

      return generated;
    }),

  generateFullStory: authedMutation
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const story = await db
        .select()
        .from(stories)
        .where(and(eq(stories.id, input.id), eq(stories.userId, ctx.user.id)))
        .limit(1);

      if (!story[0]) throw new Error("Story not found");

      const result = await storyEngine.generateFullStory({
        title: story[0].title,
        genre: story[0].genre,
        tone: story[0].tone,
        targetAudience: story[0].targetAudience,
        premise: story[0].premise || undefined,
        setting: story[0].setting || undefined,
        targetWordCount: story[0].targetWordCount || undefined,
        chapterCount: story[0].chapterCount || undefined,
        language: story[0].language || undefined,
        modelId: story[0].modelId || undefined,
        temperature: story[0].temperature || undefined,
      });

      await db
        .update(stories)
        .set({
          premise: result.outline.premise,
          setting: result.outline.setting,
          mainCharacters: result.outline.characters as any,
          plotOutline: result.outline.chapters as any,
          chapters: result.chapters as any,
          wordCount: result.wordCount,
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(stories.id, input.id));

      return result;
    }),

  update: authedMutation
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        status: z.string().optional(),
        visibility: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db
        .update(stories)
        .set({
          ...data,
          updatedAt: new Date(),
        } as any)
        .where(and(eq(stories.id, id), eq(stories.userId, ctx.user.id)));

      return { success: true };
    }),

  delete: authedMutation
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(stories)
        .where(and(eq(stories.id, input.id), eq(stories.userId, ctx.user.id)));
      return { success: true };
    }),

  listPublic: publicQuery.query(async () => {
    const result = await db
      .select()
      .from(stories)
      .where(eq(stories.visibility, "public"))
      .orderBy(desc(stories.rating));
    return result;
  }),
});
