import { getDb } from "./queries/connection";
import {
  userScores,
  scoreTransactions,
  achievementDefinitions,
  userAchievements,
  users,
} from "../db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

export const SCORE_RULES: Record<string, { points: number; description: string }> = {
  agent_create: { points: 50, description: "Created a new AI agent" },
  agent_run: { points: 10, description: "Ran an AI agent" },
  workflow_create: { points: 40, description: "Created a workflow" },
  workflow_run: { points: 15, description: "Executed a workflow" },
  knowledge_create: { points: 30, description: "Created a knowledge base" },
  document_add: { points: 5, description: "Added a document" },
  chat_start: { points: 5, description: "Started a chat conversation" },
  training_create: { points: 60, description: "Created a training job" },
  training_complete: { points: 200, description: "Completed a training job" },
  story_create: { points: 25, description: "Created a story" },
  code_project_create: { points: 35, description: "Created a code project" },
  integration_add: { points: 20, description: "Added an integration" },
  benchmark_complete: { points: 100, description: "Completed a benchmark" },
  model_create: { points: 45, description: "Registered a new model" },
  prompt_create: { points: 15, description: "Created a prompt template" },
  dataset_create: { points: 20, description: "Created a dataset" },
  daily_login: { points: 10, description: "Daily login bonus" },
  streak_bonus: { points: 50, description: "Streak milestone bonus" },
  achievement_unlock: { points: 100, description: "Unlocked an achievement" },
  other: { points: 5, description: "General activity" },
};

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function calculateLevel(totalXp: number): { level: number; currentXp: number; xpToNext: number } {
  let level = 1;
  let accumulated = 0;
  while (accumulated + xpForLevel(level) <= totalXp) {
    accumulated += xpForLevel(level);
    level++;
  }
  return {
    level,
    currentXp: totalXp - accumulated,
    xpToNext: xpForLevel(level),
  };
}

export async function ensureUserScore(userId: number) {
  const db = getDb();
  let score = await db.query.userScores.findFirst({
    where: eq(userScores.userId, userId),
  });
  if (!score) {
    const result = await db.insert(userScores).values({
      userId,
      totalScore: 0,
      currentLevel: 1,
      currentXp: 0,
      xpToNextLevel: 100,
      dailyStreak: 0,
      longestStreak: 0,
      lastActivityAt: new Date(),
      achievementsCount: 0,
    });
    score = await db.query.userScores.findFirst({
      where: eq(userScores.userId, userId),
    });
  }
  return score!;
}

export async function addScore(
  userId: number,
  actionType: keyof typeof SCORE_RULES | string,
  actionId?: string,
  metadata?: Record<string, any>
) {
  const db = getDb();
  const rule = SCORE_RULES[actionType] ?? SCORE_RULES.other;

  const score = await ensureUserScore(userId);

  // Update streak
  const now = new Date();
  const last = new Date(score.lastActivityAt);
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  let newStreak = score.dailyStreak;
  let streakBonus = 0;

  if (diffDays === 1) {
    newStreak = score.dailyStreak + 1;
    if (newStreak % 7 === 0) {
      streakBonus = SCORE_RULES.streak_bonus.points;
    }
  } else if (diffDays > 1) {
    newStreak = 1;
  } else if (diffDays === 0) {
    newStreak = score.dailyStreak;
  }

  const longestStreak = Math.max(score.longestStreak, newStreak);

  // Calculate new level
  const newTotal = Number(score.totalScore) + rule.points + streakBonus;
  const levelInfo = calculateLevel(newTotal);

  await db
    .update(userScores)
    .set({
      totalScore: newTotal,
      currentLevel: levelInfo.level,
      currentXp: levelInfo.currentXp,
      xpToNextLevel: levelInfo.xpToNext,
      dailyStreak: newStreak,
      longestStreak,
      lastActivityAt: now,
    })
    .where(eq(userScores.userId, userId));

  await db.insert(scoreTransactions).values({
    userId,
    actionType: actionType as any,
    actionId,
    points: rule.points,
    description: rule.description,
    metadata: metadata ?? null,
  });

  if (streakBonus > 0) {
    await db.insert(scoreTransactions).values({
      userId,
      actionType: "streak_bonus",
      points: streakBonus,
      description: `${newStreak} day streak bonus!`,
    });
  }

  // Check achievements
  await checkAchievements(userId);

  return {
    added: rule.points + streakBonus,
    total: newTotal,
    level: levelInfo.level,
    streak: newStreak,
  };
}

export async function checkAchievements(userId: number) {
  const db = getDb();
  const score = await ensureUserScore(userId);

  const defs = await db
    .select()
    .from(achievementDefinitions)
    .where(eq(achievementDefinitions.isActive, true));

  const existing = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  const unlockedIds = new Set(existing.filter((e) => e.isUnlocked).map((e) => e.achievementId));

  for (const def of defs) {
    if (unlockedIds.has(def.id)) continue;

    let shouldUnlock = false;
    let progress = 0;

    if (def.requirementType === "score_threshold") {
      progress = Number(score.totalScore);
      shouldUnlock = progress >= def.requirementValue;
    } else if (def.requirementType === "action_count" && def.requirementAction) {
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(scoreTransactions)
        .where(
          and(
            eq(scoreTransactions.userId, userId),
            eq(scoreTransactions.actionType, def.requirementAction as any)
          )
        );
      progress = countResult[0]?.count ?? 0;
      shouldUnlock = progress >= def.requirementValue;
    } else if (def.requirementType === "streak_days") {
      progress = score.dailyStreak;
      shouldUnlock = progress >= def.requirementValue;
    } else if (def.requirementType === "unique_actions") {
      const uniqueResult = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${scoreTransactions.actionType})` })
        .from(scoreTransactions)
        .where(eq(scoreTransactions.userId, userId));
      progress = uniqueResult[0]?.count ?? 0;
      shouldUnlock = progress >= def.requirementValue;
    } else if (def.requirementType === "special") {
      shouldUnlock = false;
    }

    const existingRecord = existing.find((e) => e.achievementId === def.id);
    if (!existingRecord) {
      await db.insert(userAchievements).values({
        userId,
        achievementId: def.id,
        progress,
        isUnlocked: shouldUnlock,
        unlockedAt: shouldUnlock ? new Date() : null,
      });
    } else if (!existingRecord.isUnlocked) {
      await db
        .update(userAchievements)
        .set({
          progress,
          isUnlocked: shouldUnlock,
          unlockedAt: shouldUnlock ? new Date() : existingRecord.unlockedAt,
        })
        .where(eq(userAchievements.id, existingRecord.id));
    }

    if (shouldUnlock && !unlockedIds.has(def.id)) {
      unlockedIds.add(def.id);
      await db
        .update(userScores)
        .set({
          totalScore: Number(score.totalScore) + def.pointsReward,
          achievementsCount: score.achievementsCount + 1,
        })
        .where(eq(userScores.userId, userId));
      await db.insert(scoreTransactions).values({
        userId,
        actionType: "achievement_unlock",
        points: def.pointsReward,
        description: `Unlocked: ${def.name}`,
        metadata: { achievementId: def.id, achievementKey: def.key },
      });
    }
  }
}

export async function seedAchievements() {
  const db = getDb();
  const existing = await db.select({ count: sql<number>`COUNT(*)` }).from(achievementDefinitions);
  if ((existing[0]?.count ?? 0) > 0) return;

  const achievements: any[] = [
    { key: "first_agent", name: "Agent Creator", description: "Create your first AI agent", icon: "bot", color: "blue", category: "creation", requirementType: "action_count", requirementAction: "agent_create", requirementValue: 1, pointsReward: 50 },
    { key: "agent_master", name: "Agent Master", description: "Create 10 AI agents", icon: "bot", color: "blue", category: "creation", requirementType: "action_count", requirementAction: "agent_create", requirementValue: 10, pointsReward: 200 },
    { key: "first_workflow", name: "Workflow Designer", description: "Create your first workflow", icon: "workflow", color: "purple", category: "creation", requirementType: "action_count", requirementAction: "workflow_create", requirementValue: 1, pointsReward: 50 },
    { key: "workflow_master", name: "Pipeline Architect", description: "Create 10 workflows", icon: "workflow", color: "purple", category: "creation", requirementType: "action_count", requirementAction: "workflow_create", requirementValue: 10, pointsReward: 200 },
    { key: "first_knowledge", name: "Knowledge Keeper", description: "Create your first knowledge base", icon: "book-open", color: "green", category: "creation", requirementType: "action_count", requirementAction: "knowledge_create", requirementValue: 1, pointsReward: 50 },
    { key: "first_training", name: "Trainer", description: "Create your first training job", icon: "graduation-cap", color: "orange", category: "creation", requirementType: "action_count", requirementAction: "training_create", requirementValue: 1, pointsReward: 50 },
    { key: "training_complete", name: "Graduate", description: "Complete your first training job", icon: "graduation-cap", color: "orange", category: "mastery", requirementType: "action_count", requirementAction: "training_complete", requirementValue: 1, pointsReward: 300 },
    { key: "first_chat", name: "Conversationalist", description: "Start your first chat", icon: "message-square", color: "cyan", category: "usage", requirementType: "action_count", requirementAction: "chat_start", requirementValue: 1, pointsReward: 25 },
    { key: "chat_master", name: "Chatterbox", description: "Start 50 chats", icon: "message-square", color: "cyan", category: "usage", requirementType: "action_count", requirementAction: "chat_start", requirementValue: 50, pointsReward: 150 },
    { key: "first_story", name: "Storyteller", description: "Create your first story", icon: "book-text", color: "pink", category: "creation", requirementType: "action_count", requirementAction: "story_create", requirementValue: 1, pointsReward: 50 },
    { key: "first_code", name: "Coder", description: "Create your first code project", icon: "code-2", color: "indigo", category: "creation", requirementType: "action_count", requirementAction: "code_project_create", requirementValue: 1, pointsReward: 50 },
    { key: "first_integration", name: "Connector", description: "Add your first integration", icon: "plug", color: "slate", category: "creation", requirementType: "action_count", requirementAction: "integration_add", requirementValue: 1, pointsReward: 50 },
    { key: "integration_master", name: "Integrator", description: "Add 5 integrations", icon: "plug", color: "slate", category: "mastery", requirementType: "action_count", requirementAction: "integration_add", requirementValue: 5, pointsReward: 150 },
    { key: "first_benchmark", name: "Tester", description: "Complete your first benchmark", icon: "gauge", color: "red", category: "mastery", requirementType: "action_count", requirementAction: "benchmark_complete", requirementValue: 1, pointsReward: 75 },
    { key: "novice", name: "Novice", description: "Reach 500 total XP", icon: "trophy", color: "amber", category: "usage", requirementType: "score_threshold", requirementValue: 500, pointsReward: 100 },
    { key: "adept", name: "Adept", description: "Reach 2,000 total XP", icon: "trophy", color: "amber", category: "usage", requirementType: "score_threshold", requirementValue: 2000, pointsReward: 250 },
    { key: "expert", name: "Expert", description: "Reach 10,000 total XP", icon: "trophy", color: "amber", category: "usage", requirementType: "score_threshold", requirementValue: 10000, pointsReward: 500 },
    { key: "master", name: "Master", description: "Reach 50,000 total XP", icon: "trophy", color: "amber", category: "usage", requirementType: "score_threshold", requirementValue: 50000, pointsReward: 1000 },
    { key: "week_streak", name: "Committed", description: "Maintain a 7-day activity streak", icon: "flame", color: "orange", category: "usage", requirementType: "streak_days", requirementValue: 7, pointsReward: 200 },
    { key: "month_streak", name: "Dedicated", description: "Maintain a 30-day activity streak", icon: "flame", color: "orange", category: "usage", requirementType: "streak_days", requirementValue: 30, pointsReward: 500 },
    { key: "jack_of_trades", name: "Jack of All Trades", description: "Use 10 different platform features", icon: "layers", color: "emerald", category: "mastery", requirementType: "unique_actions", requirementValue: 10, pointsReward: 300 },
  ];

  await db.insert(achievementDefinitions).values(achievements);
}
