import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Flame,
  Zap,
  TrendingUp,
  Target,
  Award,
  Clock,
  Crown,
  Medal,
  Star,
  Lock,
  Unlock,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const actionLabels: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  agent_create: { label: "Agent Created", icon: Zap, color: "text-blue-500" },
  agent_run: { label: "Agent Run", icon: Zap, color: "text-blue-500" },
  workflow_create: { label: "Workflow Created", icon: TrendingUp, color: "text-purple-500" },
  workflow_run: { label: "Workflow Run", icon: TrendingUp, color: "text-purple-500" },
  knowledge_create: { label: "Knowledge Base", icon: Target, color: "text-green-500" },
  document_add: { label: "Document Added", icon: Target, color: "text-green-500" },
  chat_start: { label: "Chat Started", icon: Zap, color: "text-cyan-500" },
  training_create: { label: "Training Started", icon: Award, color: "text-orange-500" },
  training_complete: { label: "Training Completed", icon: Award, color: "text-orange-500" },
  story_create: { label: "Story Created", icon: Star, color: "text-pink-500" },
  code_project_create: { label: "Code Project", icon: Zap, color: "text-indigo-500" },
  integration_add: { label: "Integration Added", icon: Zap, color: "text-slate-500" },
  benchmark_complete: { label: "Benchmark", icon: Medal, color: "text-red-500" },
  model_create: { label: "Model Added", icon: Zap, color: "text-amber-500" },
  prompt_create: { label: "Prompt Created", icon: Zap, color: "text-teal-500" },
  dataset_create: { label: "Dataset Created", icon: Zap, color: "text-lime-500" },
  daily_login: { label: "Daily Login", icon: Clock, color: "text-emerald-500" },
  streak_bonus: { label: "Streak Bonus", icon: Flame, color: "text-orange-500" },
  achievement_unlock: { label: "Achievement", icon: Trophy, color: "text-yellow-500" },
  other: { label: "Activity", icon: Zap, color: "text-gray-500" },
};

export default function ScorePage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"all" | "week" | "month">("all");

  const { data: score } = trpc.score.myScore.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: transactions } = trpc.score.transactions.useQuery(
    { limit: 50, offset: 0 },
    { enabled: !!user }
  );
  const { data: leaderboard } = trpc.score.leaderboard.useQuery(
    { period, limit: 50 },
    { enabled: !!user }
  );
  const { data: achievements } = trpc.score.achievements.useQuery(undefined, {
    enabled: !!user,
  });

  const progress = score
    ? Math.min(100, Math.round((score.currentXp / score.xpToNextLevel) * 100))
    : 0;

  const unlockedCount = achievements?.filter((a) => a.isUnlocked).length ?? 0;
  const totalAchievements = achievements?.length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Score & Achievements
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your progress, compete on the leaderboard, and unlock achievements.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total XP</p>
                  <p className="text-3xl font-bold mt-1">
                    {Number(score?.totalScore ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="text-3xl font-bold mt-1">{score?.currentLevel ?? 1}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {score?.currentXp ?? 0} / {score?.xpToNextLevel ?? 100} XP
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10">
                  <Crown className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <Progress value={progress} className="h-2 mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Streak</p>
                  <p className="text-3xl font-bold mt-1">{score?.dailyStreak ?? 0}d</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Best: {score?.longestStreak ?? 0}d
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                  <p className="text-3xl font-bold mt-1">
                    {unlockedCount}/{totalAchievements}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Award className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements?.map((ach) => {
                const Icon = ach.isUnlocked ? Unlock : Lock;
                const progressPct = Math.min(
                  100,
                  Math.round((ach.progress / ach.requirementValue) * 100)
                );
                return (
                  <Card
                    key={ach.id}
                    className={
                      ach.isUnlocked
                        ? "border-primary/30 bg-primary/5"
                        : "opacity-80"
                    }
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-lg bg-${ach.color}-500/10`}
                          >
                            <Trophy className={`h-5 w-5 text-${ach.color}-500`} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{ach.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ach.description}
                            </p>
                          </div>
                        </div>
                        <Icon
                          className={`h-4 w-4 ${
                            ach.isUnlocked ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {ach.progress} / {ach.requirementValue}
                          </span>
                        </div>
                        <Progress value={progressPct} className="h-1.5" />
                      </div>
                      {ach.isUnlocked && (
                        <Badge variant="outline" className="text-xs w-fit">
                          +{ach.pointsReward} XP
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest XP gains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions && transactions.length > 0 ? (
                    transactions.map((tx) => {
                      const meta = actionLabels[tx.actionType] ?? actionLabels.other;
                      const Icon = meta.icon;
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md bg-muted`}>
                              <Icon className={`h-4 w-4 ${meta.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {tx.description ?? meta.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(tx.createdAt), "MMM d, yyyy h:mm a")}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-500 text-white">
                            +{tx.points} XP
                          </Badge>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No activity yet. Start using the platform to earn XP!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant={period === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setPeriod("all")}
              >
                All Time
              </Badge>
              <Badge
                variant={period === "week" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setPeriod("week")}
              >
                This Week
              </Badge>
              <Badge
                variant={period === "month" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setPeriod("month")}
              >
                This Month
              </Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>Top platform users by XP</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard && leaderboard.length > 0 ? (
                    leaderboard.map((entry, idx) => {
                      const isMe = entry.userId === user?.id;
                      const rankColor =
                        idx === 0
                          ? "text-yellow-500"
                          : idx === 1
                          ? "text-slate-400"
                          : idx === 2
                          ? "text-amber-600"
                          : "text-muted-foreground";
                      return (
                        <div
                          key={entry.userId}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            isMe ? "border-primary/30 bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-sm font-bold w-6 text-center ${rankColor}`}
                            >
                              {idx + 1}
                            </span>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={entry.avatar ?? ""} />
                              <AvatarFallback>
                                {entry.name?.[0] ?? "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {entry.name ?? "User"}
                                {isMe && (
                                  <span className="ml-2 text-xs text-primary">
                                    You
                                  </span>
                                )}
                              </p>
                              {period === "all" && (
                                <p className="text-xs text-muted-foreground">
                                  Level {entry.currentLevel} •{" "}
                                  {entry.achievementsCount} achievements
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">
                              {Number(entry.totalScore).toLocaleString()} XP
                            </p>
                            {period === "all" && entry.dailyStreak > 0 && (
                              <p className="text-xs text-orange-500 flex items-center justify-end gap-1">
                                <Flame className="h-3 w-3" />
                                {entry.dailyStreak}d
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No leaderboard data yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
