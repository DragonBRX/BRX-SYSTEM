import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Zap } from "lucide-react";
import { Link } from "react-router";

export function ScoreBadge() {
  const { user } = useAuth();
  const { data: score } = trpc.score.myScore.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (!user || !score) return null;

  const progress = Math.min(100, Math.round((score.currentXp / score.xpToNextLevel) * 100));

  return (
    <Link to="/score" className="block">
      <div className="rounded-lg border bg-card p-3 space-y-2 hover:border-primary/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold">Level {score.currentLevel}</p>
              <p className="text-[10px] text-muted-foreground">{Number(score.totalScore).toLocaleString()} XP</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-orange-500">
            <Flame className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold">{score.dailyStreak}d</span>
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
    </Link>
  );
}
