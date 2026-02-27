import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser } from "@/context/UserContext";
import { Dumbbell, Home, Building2 } from "lucide-react";
import { findTodayIndex, getTodayRussian } from "@/lib/dayHelper";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function TodayWorkoutDialog({ open, onOpenChange }: Props) {
  const { profile } = useUser();
  const [location, setLocation] = useState<"gym" | "home">(profile.workoutLocation || "gym");
  const [todayWorkout, setTodayWorkout] = useState<WorkoutDay | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const { data } = await supabase
        .from("admin_workouts")
        .select("*")
        .eq("location", location)
        .order("sort_order");

      if (data && data.length > 0) {
        const days: WorkoutDay[] = data.map((r: any) => ({
          day: r.day,
          type: r.type,
          exercises: r.exercises as unknown as Exercise[],
        }));
        const idx = findTodayIndex(days);
        setTodayWorkout(days[idx] || null);
        return;
      }

      const cacheKey = `workouts_${profile.fitnessLevel}_${location}_${profile.goal}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const days: WorkoutDay[] = JSON.parse(cached);
          const idx = findTodayIndex(days);
          setTodayWorkout(days[idx] || null);
        } catch { setTodayWorkout(null); }
      } else {
        setTodayWorkout(null);
      }
    };

    load();
  }, [open, location, profile.fitnessLevel, profile.goal]);

  const switchLocation = (loc: "gym" | "home") => setLocation(loc);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5" /> Тренировка · {getTodayRussian()}
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mt-2">
            {([["gym", "Зал", Building2], ["home", "Дома", Home]] as const).map(([val, label, Icon]) => (
              <button key={val} onClick={() => switchLocation(val)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all border ${
                  location === val ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {todayWorkout ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">{todayWorkout.day} · {todayWorkout.type}</p>
              <p className="text-xs text-muted-foreground mb-2">{todayWorkout.exercises.length} упражнений</p>
              {todayWorkout.exercises.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedExercise(ex)}
                  className="flex justify-between items-center text-sm py-1.5 px-1 -mx-1 w-full text-left rounded-lg hover:bg-accent/50 transition-colors border-b border-border last:border-0"
                >
                  <span className="text-foreground">{ex.name}</span>
                  <span className="text-muted-foreground font-mono text-xs">{ex.sets}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <p className="text-sm text-muted-foreground">Данные тренировки ещё не загружены</p>
              <Link to="/workouts" onClick={() => onOpenChange(false)}
                className="text-sm text-primary hover:underline">
                Перейти в Тренировки →
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </>
  );
}
