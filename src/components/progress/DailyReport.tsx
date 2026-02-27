import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ClipboardCheck, Moon, Footprints } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { format } from "date-fns";
import { motion } from "framer-motion";

const energyLabels: Record<number, string> = {
  1: "😩 Без сил", 2: "😔 Плохо", 3: "😕 Слабо", 4: "😐 Ниже среднего",
  5: "🙂 Нормально", 6: "😊 Неплохо", 7: "💪 Хорошо", 8: "🔥 Отлично",
  9: "⚡ Супер", 10: "🚀 Максимум",
};

const nutritionLabels: Record<number, string> = {
  1: "🍫 Ужасно", 2: "😬 Очень плохо", 3: "😕 Плохо", 4: "😐 Ниже среднего",
  5: "🙂 Средне", 6: "😊 Неплохо", 7: "🥗 Хорошо", 8: "💚 Отлично",
  9: "🌟 Почти идеально", 10: "👑 Идеально",
};

const sleepHourLabels: Record<number, string> = {
  1: "1ч", 2: "2ч", 3: "3ч", 4: "4ч", 5: "5ч", 6: "6ч",
  7: "7ч", 8: "8ч", 9: "9ч", 10: "10ч", 11: "11ч", 12: "12ч",
};

export default function DailyReport() {
  const { profile, updateProfile, addXP } = useUser();
  const today = format(new Date(), "yyyy-MM-dd");
  const alreadySubmitted = profile.dailyReports.some(r => r.date === today);

  const [workoutDone, setWorkoutDone] = useState(false);
  const [energy, setEnergy] = useState(5);
  const [nutritionScore, setNutritionScore] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [steps, setSteps] = useState("");
  const [submitted, setSubmitted] = useState(alreadySubmitted);

  const handleSubmit = () => {
    const entry = { date: today, workoutDone, energy, nutrition: nutritionScore, sleep, steps: steps ? parseInt(steps) : 0 };
    const updatedReports = [...profile.dailyReports.filter(r => r.date !== today), entry];
    updateProfile({ dailyReports: updatedReports });
    addXP(5);
    setSubmitted(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="bg-card rounded-xl border border-border p-5 shadow-soft space-y-5"
    >
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-primary" /> Ежедневный отчёт
      </h3>

      {submitted ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">✅ Отчёт за сегодня сдан! +5 баллов</p>
        </div>
      ) : (
        <>
          {/* Workout toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Тренировка выполнена</label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{workoutDone ? "Да ✅" : "Нет"}</span>
              <Switch checked={workoutDone} onCheckedChange={setWorkoutDone} />
            </div>
          </div>

          {/* Energy slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted-foreground">Уровень энергии</label>
              <span className="text-sm font-medium text-foreground">{energyLabels[energy]}</span>
            </div>
            <Slider value={[energy]} onValueChange={v => setEnergy(v[0])} min={1} max={10} step={1} />
          </div>

          {/* Nutrition slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted-foreground">Качество питания</label>
              <span className="text-sm font-medium text-foreground">{nutritionLabels[nutritionScore]}</span>
            </div>
            <Slider value={[nutritionScore]} onValueChange={v => setNutritionScore(v[0])} min={1} max={10} step={1} />
          </div>

          {/* Sleep hours slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Moon className="w-4 h-4" /> Часов сна
              </label>
              <span className="text-sm font-medium text-foreground">{sleepHourLabels[sleep]}</span>
            </div>
            <Slider value={[sleep]} onValueChange={v => setSleep(v[0])} min={1} max={12} step={1} />
          </div>

          {/* Steps input */}
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <Footprints className="w-4 h-4" /> Количество шагов
            </label>
            <input type="number" placeholder="Например, 8000" value={steps} onChange={e => setSteps(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <ClipboardCheck className="w-4 h-4" /> Отметить день (+5 баллов)
          </button>
        </>
      )}
    </motion.div>
  );
}
