import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import { Check, Dumbbell, RefreshCw, Home, Building2, Sparkles, Lock } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { generateContent } from "@/lib/ai";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Exercise {
  name: string;
  sets: string;
  image?: string;
}

interface WorkoutDay {
  day: string;
  type: string;
  exercises: Exercise[];
}

export default function Workouts() {
  const { profile, setProfile } = useUser();
  const { user } = useAuth();
  const [plan, setPlan] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [savingWorkoutKey, setSavingWorkoutKey] = useState<string | null>(null);
  const [location, setLocation] = useState<"gym" | "home">(profile.workoutLocation || "gym");
  const [isAdminPlan, setIsAdminPlan] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const loadAdminWorkouts = useCallback(async (loc: string): Promise<WorkoutDay[] | null> => {
    const { data } = await supabase
      .from("admin_workouts")
      .select("*")
      .eq("location", loc)
      .order("sort_order");

    if (data && data.length > 0) {
      return data.map((r: any) => ({
        day: r.day,
        type: r.type,
        exercises: r.exercises as unknown as Exercise[],
      }));
    }
    return null;
  }, []);

  const generate = useCallback(async (loc?: "gym" | "home") => {
    setLoading(true);
    setCompleted(new Set());
    const targetLoc = loc || location;
    try {
      const profileWithLoc = { ...profile, workoutLocation: targetLoc };
      const data = await generateContent("workouts", profileWithLoc);
      if (data?.days) {
        setPlan(data.days);
        setIsAdminPlan(false);
        localStorage.setItem(`workouts_${profile.fitnessLevel}_${targetLoc}_${profile.goal}`, JSON.stringify(data.days));
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Ошибка генерации тренировок");
    } finally {
      setLoading(false);
    }
  }, [profile, location]);

  const loadForLocation = useCallback(async (loc: "gym" | "home") => {
    setLoading(true);
    // Check if user has a personal upgraded plan
    const personalKey = `workouts_personal_${loc}_${profile.goal}`;
    const personal = localStorage.getItem(personalKey);
    if (personal) {
      try {
        setPlan(JSON.parse(personal));
        setIsAdminPlan(false);
        setLoading(false);
        return;
      } catch {}
    }
    // Try admin workouts
    const adminPlan = await loadAdminWorkouts(loc);
    if (adminPlan) {
      setPlan(adminPlan);
      setIsAdminPlan(true);
      setLoading(false);
      return;
    }
    // Fallback to cache / AI
    const cacheKey = `workouts_${profile.fitnessLevel}_${loc}_${profile.goal}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setPlan(JSON.parse(cached));
        setIsAdminPlan(false);
        setLoading(false);
        return;
      } catch {}
    }
    setLoading(false);
    generate(loc);
  }, [loadAdminWorkouts, profile.fitnessLevel, profile.goal, generate]);

  useEffect(() => {
    loadForLocation(location);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const completedKeys = new Set(
      (profile.completedWorkouts || [])
        .filter((key) => key.startsWith(`${location}-`))
        .map((key) => Number(key.split("-").at(-1)))
        .filter((idx) => !Number.isNaN(idx)),
    );
    setCompleted(completedKeys);
  }, [location, profile.completedWorkouts]);

  const switchLocation = (loc: "gym" | "home") => {
    setLocation(loc);
    loadForLocation(loc);
  };

  const toggleComplete = async (idx: number) => {
    if (!user) return;

    const key = `${location}-${idx}`;
    if (savingWorkoutKey === key) return;

    const wasCompleted = completed.has(idx);
    const updatedWorkouts = wasCompleted
      ? (profile.completedWorkouts || []).filter((item) => item !== key)
      : [...(profile.completedWorkouts || []), key];
    const newXP = wasCompleted ? profile.xp : profile.xp + 5;
    const newLevel = Math.floor(newXP / 100) + 1;

    setSavingWorkoutKey(key);

    const { error } = await supabase
      .from("profiles")
      .update({
        completed_workouts: updatedWorkouts,
        xp: newXP,
        level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    setSavingWorkoutKey(null);

    if (error) {
      console.error("Workout completion save error:", error);
      toast.error("Не удалось сохранить отметку о тренировке");
      return;
    }

    setCompleted((prev) => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(idx);
      else next.add(idx);
      return next;
    });
    setProfile((prev) => ({
      ...prev,
      completedWorkouts: updatedWorkouts,
      xp: newXP,
      level: newLevel,
    }));
  };

  const upgradePlan = async () => {
    if (profile.level < 10) return;
    setUpgrading(true);
    try {
      const data = await generateContent("workouts", { ...profile, workoutLocation: location });
      if (data?.days) {
        setPlan(data.days);
        setIsAdminPlan(false);
        const personalKey = `workouts_personal_${location}_${profile.goal}`;
        localStorage.setItem(personalKey, JSON.stringify(data.days));
        toast.success("Программа прокачана под ваш профиль!");
      }
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации");
    } finally {
      setUpgrading(false);
    }
  };

  const canUpgrade = profile.level >= 10;

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Тренировки</h1>
              <p className="text-muted-foreground mt-1">
                {isAdminPlan ? "План от тренера" : `Персональный AI-план · ${profile.fitnessLevel === "beginner" ? "Новичок" : profile.fitnessLevel === "intermediate" ? "Средний" : "Продвинутый"}`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Upgrade button */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <button
            onClick={upgradePlan}
            disabled={!canUpgrade || upgrading || loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border ${
              canUpgrade
                ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                : "border-border bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {upgrading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : canUpgrade ? (
              <Sparkles className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <div className="flex flex-col items-center">
              <span>Прокачать программу</span>
              {!canUpgrade && (
                <span className="text-[10px] opacity-70">Доступно после 10-го уровня</span>
              )}
            </div>
          </button>
        </motion.div>

        {/* Location toggle */}
        <div className="flex gap-2">
          {([["gym", "Зал", Building2], ["home", "Дома", Home]] as const).map(([val, label, Icon]) => (
            <button key={val} onClick={() => switchLocation(val)} disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                location === val ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {plan.map((day, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-card rounded-xl border border-border shadow-soft overflow-hidden ${completed.has(idx) ? "opacity-70" : ""}`}
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-wellness-peach flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{day.day} · {day.type}</p>
                      <p className="text-xs text-muted-foreground">{day.exercises.length} упражнений</p>
                    </div>
                  </div>
                  <button onClick={() => toggleComplete(idx)}
                    disabled={savingWorkoutKey === `${location}-${idx}`}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      completed.has(idx) ? "border-primary bg-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {savingWorkoutKey === `${location}-${idx}` ? (
                      <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
                    ) : (
                      completed.has(idx) && <Check className="w-4 h-4 text-primary-foreground" />
                    )}
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  {day.exercises.map((ex, eIdx) => (
                    <button
                      key={eIdx}
                      onClick={() => setSelectedExercise(ex)}
                      className="flex justify-between items-center text-sm w-full text-left py-1 px-1 -mx-1 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-foreground">{ex.name}</span>
                      <span className="text-muted-foreground font-mono text-xs">{ex.sets}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Exercise detail dialog */}
        <Dialog open={!!selectedExercise} onOpenChange={(v) => !v && setSelectedExercise(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg">{selectedExercise?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedExercise?.image && (
                <img
                  src={selectedExercise.image}
                  alt={selectedExercise.name}
                  className="w-full rounded-xl object-cover max-h-64"
                />
              )}
              <div className="flex items-center gap-2 text-sm">
                <Dumbbell className="w-4 h-4 text-primary" />
                <span className="text-foreground font-medium">{selectedExercise?.sets}</span>
              </div>
              {!selectedExercise?.image && (
                <p className="text-xs text-muted-foreground">Изображение не добавлено</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
