import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Apple, Clock } from "lucide-react";
import { findTodayIndex, getTodayRussian } from "@/lib/dayHelper";
import { Link } from "react-router-dom";

interface Meal {
  time: string;
  meal: string;
  items: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface MealDay {
  dayName: string;
  meals: Meal[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function TodayNutritionDialog({ open, onOpenChange }: Props) {
  const [todayMeals, setTodayMeals] = useState<MealDay | null>(null);

  useEffect(() => {
    if (!open) return;
    const cached = localStorage.getItem("ai_meals");
    if (cached) {
      try {
        const days: MealDay[] = JSON.parse(cached);
        const idx = findTodayIndex(days);
        setTodayMeals(days[idx] || null);
      } catch { setTodayMeals(null); }
    } else {
      setTodayMeals(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="w-5 h-5" /> Питание · {getTodayRussian()}
          </DialogTitle>
        </DialogHeader>

        {todayMeals ? (
          <div className="mt-2 space-y-3">
            {todayMeals.meals.map((meal, idx) => (
              <div key={idx} className="bg-muted/50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono">{meal.time}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{meal.meal}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {meal.items.map((item, i) => (
                    <span key={i} className="text-xs bg-background text-muted-foreground px-2 py-1 rounded-md">{item}</span>
                  ))}
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{meal.calories} ккал</span>
                  <span>Б: {meal.protein}г</span>
                  <span>Ж: {meal.fat}г</span>
                  <span>У: {meal.carbs}г</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-muted-foreground">План питания ещё не загружен</p>
            <Link to="/nutrition" onClick={() => onOpenChange(false)}
              className="text-sm text-primary hover:underline">
              Перейти в Питание →
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
