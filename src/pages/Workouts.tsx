import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { Check, Dumbbell } from "lucide-react";
import { useState } from "react";

const workoutPlans: Record<string, { day: string; type: string; exercises: { name: string; sets: string }[] }[]> = {
  beginner: [
    { day: "Пн", type: "Силовая (верх)", exercises: [{ name: "Жим гантелей лёжа", sets: "3×12" }, { name: "Тяга гантели в наклоне", sets: "3×12" }, { name: "Жим стоя", sets: "3×10" }, { name: "Планка", sets: "3×30с" }] },
    { day: "Ср", type: "Силовая (низ)", exercises: [{ name: "Приседания", sets: "3×15" }, { name: "Выпады", sets: "3×12" }, { name: "Мост", sets: "3×15" }, { name: "Подъёмы на носки", sets: "3×20" }] },
    { day: "Пт", type: "Кардио + мобильность", exercises: [{ name: "Ходьба", sets: "30 мин" }, { name: "Растяжка", sets: "15 мин" }, { name: "Дыхательные упражнения", sets: "5 мин" }] },
  ],
  intermediate: [
    { day: "Пн", type: "Верх (push)", exercises: [{ name: "Жим штанги", sets: "4×10" }, { name: "Жим гантелей на наклонной", sets: "3×12" }, { name: "Французский жим", sets: "3×12" }, { name: "Разведения", sets: "3×15" }] },
    { day: "Вт", type: "Низ", exercises: [{ name: "Приседания со штангой", sets: "4×8" }, { name: "Румынская тяга", sets: "3×10" }, { name: "Жим ногами", sets: "3×12" }, { name: "Икры", sets: "4×15" }] },
    { day: "Чт", type: "Верх (pull)", exercises: [{ name: "Подтягивания", sets: "4×8" }, { name: "Тяга штанги", sets: "3×10" }, { name: "Бицепс", sets: "3×12" }, { name: "Фейс-пулл", sets: "3×15" }] },
    { day: "Сб", type: "Кардио HIIT", exercises: [{ name: "Интервальный бег", sets: "20 мин" }, { name: "Бёрпи", sets: "4×10" }, { name: "Скакалка", sets: "3×1мин" }] },
  ],
  advanced: [
    { day: "Пн", type: "Грудь + Трицепс", exercises: [{ name: "Жим штанги", sets: "5×5" }, { name: "Жим на наклонной", sets: "4×8" }, { name: "Кроссовер", sets: "3×12" }, { name: "Отжимания на брусьях", sets: "3×макс" }] },
    { day: "Вт", type: "Спина + Бицепс", exercises: [{ name: "Становая тяга", sets: "5×5" }, { name: "Подтягивания с весом", sets: "4×6" }, { name: "Тяга в наклоне", sets: "4×8" }, { name: "Молотки", sets: "3×12" }] },
    { day: "Ср", type: "Ноги", exercises: [{ name: "Приседания", sets: "5×5" }, { name: "Фронтальные приседания", sets: "3×8" }, { name: "Выпады с гантелями", sets: "3×12" }, { name: "GHR", sets: "3×10" }] },
    { day: "Пт", type: "Плечи + руки", exercises: [{ name: "Армейский жим", sets: "4×8" }, { name: "Махи в стороны", sets: "4×12" }, { name: "Суперсет бицепс/трицепс", sets: "4×10" }] },
    { day: "Сб", type: "Кондиционинг", exercises: [{ name: "Комплекс со штангой", sets: "5 раундов" }, { name: "Гребля", sets: "2000м" }] },
  ],
};

export default function Workouts() {
  const { profile, addXP } = useUser();
  const plan = workoutPlans[profile.fitnessLevel] || workoutPlans.beginner;
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const toggleComplete = (idx: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else { next.add(idx); addXP(5); }
      return next;
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">Тренировки</h1>
          <p className="text-muted-foreground mt-1">
            Уровень: {profile.fitnessLevel === "beginner" ? "Новичок" : profile.fitnessLevel === "intermediate" ? "Средний" : "Продвинутый"}
          </p>
        </motion.div>

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
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    completed.has(idx) ? "border-primary bg-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  {completed.has(idx) && <Check className="w-4 h-4 text-primary-foreground" />}
                </button>
              </div>
              <div className="p-4 space-y-2">
                {day.exercises.map((ex, eIdx) => (
                  <div key={eIdx} className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{ex.name}</span>
                    <span className="text-muted-foreground font-mono text-xs">{ex.sets}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-muted rounded-xl p-4">
          <p className="text-xs text-muted-foreground">
            🔄 При пропуске тренировки AI автоматически скорректирует нагрузку. Прогрессия увеличивается каждые 2 недели.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
