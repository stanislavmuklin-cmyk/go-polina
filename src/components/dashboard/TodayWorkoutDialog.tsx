import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser } from "@/context/UserContext";
import { Dumbbell, Home, Building2 } from "lucide-react";
import { findTodayIndex, getTodayRussian } from "@/lib/dayHelper";
import { Link } from "react-router-dom";

interface WorkoutDay {
  day: string;
  type: string;
  exercises: { name: string; sets: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function TodayWorkoutDialog({ open, onOpenChange }: Props) {
  const { profile } = useUser();
  const [location, setLocation] = useState<"gym" | "home">(profile.workoutLocation || "gym");
  const [todayWorkout, setTodayWorkout] = useState<WorkoutDay | null>(null);

  useEffect(() => {
    if (!open) return;
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
  }, [open, location, profile.fitnessLevel, profile.goal]);

  const switchLocation = (loc: "gym" | "home") => setLocation(loc);

  return (
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
              <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-border last:border-0">
                <span className="text-foreground">{ex.name}</span>
                <span className="text-muted-foreground font-mono text-xs">{ex.sets}</span>
              </div>
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
  );
}
