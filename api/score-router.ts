import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { userScores, scoreTransactions, achievementDefinitions, userAchievements, users } from "../db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { addScore, seedAchievements, ensureUserScore } from "./score-engine";

export const scoreRouter = createRouter({
  myScore: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const score = await ensureUserScore(ctx.user.id);
    return score;
  }),

  transactions: authedQuery
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;
      return db
        .select()
        .from(scoreTransactions)
        .where(eq(scoreTransactions.userId, ctx.user.id))
        .orderBy(desc(scoreTransactions.createdAt))
        .limit(limit)
        .offset(offset);
    }),

  leaderboard: authedQuery
    .input(
      z.object({
        period: z.enum(["all", "week", "month"]).default("all"),
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 50;
      const period = input?.period ?? "all";

      if (period === "all") {
        const results = await db
          .select({
            userId: userScores.userId,
            totalScore: userScores.totalScore,
            currentLevel: userScores.currentLevel,
            achievementsCount: userScores.achievementsCount,
            dailyStreak: userScores.dailyStreak,
            name: users.name,
            email: users.email,
            avatar: users.avatar,
          })
          .from(userScores)
          .innerJoin(users, eq(userScores.userId, users.id))
          .orderBy(desc(userScores.totalScore))
          .limit(limit);
        return results;
      }

      const days = period === "week" ? 7 : 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const results = await db
        .select({
          userId: scoreTransactions.userId,
          totalScore: sql<number>`SUM(${scoreTransactions.points})`,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
        })
        .from(scoreTransactions)
        .innerJoin(users, eq(scoreTransactions.userId, users.id))
        .where(gte(scoreTransactions.createdAt, since))
        .groupBy(scoreTransactions.userId)
        .orderBy(desc(sql<number>`SUM(${scoreTransactions.points})`))
        .limit(limit);

      return results.map((r) => ({
        ...r,
        currentLevel: 1,
        achievementsCount: 0,
        dailyStreak: 0,
      }));
    }),

  achievements: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    await seedAchievements();
    const defs = await db
      .select()
      .from(achievementDefinitions)
      .where(eq(achievementDefinitions.isActive, true));

    const userAch = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, ctx.user.id));

    return defs.map((def) => {
      const ua = userAch.find((u) => u.achievementId === def.id);
      return {
        ...def,
        progress: ua?.progress ?? 0,
        isUnlocked: ua?.isUnlocked ?? false,
        unlockedAt: ua?.unlockedAt,
      };
    });
  }),

  addPoints: authedQuery
    .input(
      z.object({
        actionType: z.string(),
        actionId: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await addScore(
        ctx.user.id,
        input.actionType,
        input.actionId,
        input.metadata
      );
      return result;
    }),

  adminSeed: adminQuery.mutation(async () => {
    await seedAchievements();
    return { success: true };
  }),
});
