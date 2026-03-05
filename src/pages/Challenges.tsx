import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Swords, Check, Trophy, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format, eachDayOfInterval, parseISO, isToday, isBefore, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";

interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  xp_reward: number;
  is_active: boolean;
}

interface ChallengeProgress {
  challenge_id: string;
  checked_date: string;
}

export default function Challenges() {
  const { user } = useAuth();
  const { addXP } = useUser();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<ChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: ch }, { data: pr }] = await Promise.all([
      supabase.from("challenges").select("*").eq("is_active", true).order("start_date"),
      supabase.from("challenge_progress").select("challenge_id, checked_date").eq("user_id", user.id),
    ]);
    if (ch) setChallenges(ch as Challenge[]);
    if (pr) setProgress(pr as ChallengeProgress[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const checkedDates = (challengeId: string) =>
    new Set(progress.filter((p) => p.challenge_id === challengeId).map((p) => p.checked_date));

  const handleCheckIn = async (challengeId: string) => {
    if (!user) return;
    setCheckingIn(challengeId);
    const today = new Date().toISOString().split("T")[0];
    try {
      const { error } = await supabase.from("challenge_progress").insert({
        challenge_id: challengeId,
        user_id: user.id,
        checked_date: today,
      });
      if (error) throw error;

      const newProgress = [...progress, { challenge_id: challengeId, checked_date: today }];
      setProgress(newProgress);

      // Check if challenge is now complete
      const challenge = challenges.find((c) => c.id === challengeId);
      if (challenge) {
        const checked = newProgress.filter((p) => p.challenge_id === challengeId).length;
        if (checked >= challenge.duration_days) {
          addXP(challenge.xp_reward);
          toast.success(`🎉 Челлендж завершён! +${challenge.xp_reward} XP`);
        } else {
          toast.success("Отметка поставлена! ✓");
        }
      }
    } catch (e: any) {
      if (e.message?.includes("duplicate")) {
        toast.error("Вы уже отметились сегодня");
      } else {
        toast.error(e.message || "Ошибка");
      }
    } finally {
      setCheckingIn(null);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Swords className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Челленджи</h1>
        </div>

        {challenges.length === 0 ? (
          <p className="text-muted-foreground">Пока нет активных челленджей.</p>
        ) : (
          challenges.map((challenge) => {
            const checked = checkedDates(challenge.id);
            const checkedCount = checked.size;
            const isComplete = checkedCount >= challenge.duration_days;
            const today = new Date().toISOString().split("T")[0];
            const todayChecked = checked.has(today);

            const days = eachDayOfInterval({
              start: parseISO(challenge.start_date),
              end: parseISO(challenge.end_date),
            });

            return (
              <Card key={challenge.id} className={isComplete ? "border-primary/50 bg-primary/5" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {isComplete ? (
                      <Trophy className="w-5 h-5 text-primary" />
                    ) : (
                      <Swords className="w-5 h-5 text-primary" />
                    )}
                    {challenge.title}
                  </CardTitle>
                  {challenge.description && (
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{checkedCount} / {challenge.duration_days} дней</span>
                      <span>{Math.round((checkedCount / challenge.duration_days) * 100)}%</span>
                    </div>
                    <Progress value={(checkedCount / challenge.duration_days) * 100} className="h-2" />
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day-of-week headers */}
                    {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
                      <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">
                        {d}
                      </div>
                    ))}
                    {/* Offset for first day */}
                    {(() => {
                      const firstDay = parseISO(challenge.start_date);
                      const dow = firstDay.getDay(); // 0=Sun
                      const offset = dow === 0 ? 6 : dow - 1; // Mon=0
                      return Array.from({ length: offset }).map((_, i) => (
                        <div key={`offset-${i}`} />
                      ));
                    })()}
                    {days.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const isChecked = checked.has(dateStr);
                      const isTodayDate = isToday(day);
                      const isPast = isBefore(startOfDay(day), startOfDay(new Date()));

                      return (
                        <div
                          key={dateStr}
                          className={`
                            aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative transition-all
                            ${isChecked
                              ? "bg-primary text-primary-foreground font-bold"
                              : isTodayDate
                                ? "bg-accent text-accent-foreground ring-1 ring-primary"
                                : isPast
                                  ? "bg-muted/50 text-muted-foreground"
                                  : "bg-muted/30 text-muted-foreground"
                            }
                          `}
                        >
                          <span className="text-[10px] leading-none">{format(day, "d")}</span>
                          <span className="text-[8px] leading-none mt-0.5 opacity-60">
                            {format(day, "MMM", { locale: ru })}
                          </span>
                          {isChecked && (
                            <Check className="w-2.5 h-2.5 absolute top-0.5 right-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Check-in button */}
                  {!isComplete && (
                    <Button
                      onClick={() => handleCheckIn(challenge.id)}
                      disabled={todayChecked || checkingIn === challenge.id}
                      className="w-full"
                    >
                      {checkingIn === challenge.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : todayChecked ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Swords className="w-4 h-4 mr-2" />
                      )}
                      {todayChecked ? "Отмечено сегодня" : "Отметиться"}
                    </Button>
                  )}

                  {isComplete && (
                    <div className="text-center text-sm font-medium text-primary">
                      🎉 Челлендж выполнен! +{challenge.xp_reward} XP
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground text-center">
                    {format(parseISO(challenge.start_date), "d MMM", { locale: ru })} — {format(parseISO(challenge.end_date), "d MMM yyyy", { locale: ru })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </motion.div>
    </AppLayout>
  );
}
