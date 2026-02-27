import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { TrendingDown, Battery, Moon, Ruler, ClipboardCheck, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { generateContent } from "@/lib/ai";
import ReactMarkdown from "react-markdown";

const weekData = [
  { day: "Пн", weight: 65.2, energy: 7, sleep: 7.5 },
  { day: "Вт", weight: 65.0, energy: 8, sleep: 8 },
  { day: "Ср", weight: 64.8, energy: 6, sleep: 6.5 },
  { day: "Чт", weight: 64.9, energy: 7, sleep: 7 },
  { day: "Пт", weight: 64.6, energy: 8, sleep: 7.5 },
  { day: "Сб", weight: 64.5, energy: 9, sleep: 8.5 },
  { day: "Вс", weight: 64.4, energy: 7, sleep: 7 },
];

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

export default function Progress() {
  const { profile } = useUser();
  const location = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeMetric, setActiveMetric] = useState<"weight" | "energy" | "sleep">("weight");

  // Report state
  const [weight, setWeight] = useState("");
  const [workoutDone, setWorkoutDone] = useState(false);
  const [energy, setEnergy] = useState(5);
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [glutes, setGlutes] = useState("");
  const [thigh, setThigh] = useState("");
  const [nutritionScore, setNutritionScore] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<{ summary: string; recommendations: string[]; encouragement: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const currentWeight = weekData[weekData.length - 1].weight;
  const startWeight = weekData[0].weight;
  const weightChange = (currentWeight - startWeight).toFixed(1);
  const maxVal = Math.max(...weekData.map(d => d[activeMetric]));
  const minVal = Math.min(...weekData.map(d => d[activeMetric]));

  useEffect(() => {
    if (location.hash === "#report" && reportRef.current) {
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, [location.hash]);

  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    setAiError(null);
    setAiResponse(null);
    try {
      const reportData = {
        weight: weight ? parseFloat(weight) : null,
        workoutDone,
        energy,
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        glutes: glutes ? parseFloat(glutes) : null,
        thigh: thigh ? parseFloat(thigh) : null,
        nutritionScore,
      };
      const result = await generateContent("report", profile, reportData);
      setAiResponse(result);
    } catch (err: any) {
      setAiError(err.message || "Ошибка анализа");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">Прогресс</h1>
          <p className="text-muted-foreground mt-1">Отслеживайте изменения</p>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border text-center">
            <TrendingDown className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-lg font-bold text-foreground">{weightChange} кг</p>
            <p className="text-xs text-muted-foreground">За неделю</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border text-center">
            <Battery className="w-5 h-5 mx-auto mb-2 text-wellness-gold" />
            <p className="text-lg font-bold text-foreground">7.4</p>
            <p className="text-xs text-muted-foreground">Энергия (ср.)</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border text-center">
            <Moon className="w-5 h-5 mx-auto mb-2 text-wellness-purple" />
            <p className="text-lg font-bold text-foreground">7.4ч</p>
            <p className="text-xs text-muted-foreground">Сон (ср.)</p>
          </div>
        </div>

        {/* Metric toggle */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {([["weight", "Вес"], ["energy", "Энергия"], ["sleep", "Сон"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveMetric(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeMetric === key ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
              }`}
            >{label}</button>
          ))}
        </div>

        {/* Simple chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-card rounded-xl border border-border p-5 shadow-soft"
        >
          <div className="flex items-end justify-between gap-2 h-40">
            {weekData.map((d, idx) => {
              const val = d[activeMetric];
              const range = maxVal - minVal || 1;
              const heightPct = ((val - minVal) / range) * 70 + 30;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-mono">{val}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    className="w-full rounded-t-md bg-primary/80"
                  />
                  <span className="text-xs text-muted-foreground">{d.day}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Report Panel */}
        <div ref={reportRef} id="report">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-5 shadow-soft space-y-5"
          >
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" /> Ежедневный отчёт
            </h3>

            {/* Weight */}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Вес (кг)</label>
              <input type="number" step="0.1" placeholder={`${profile.weight}`} value={weight} onChange={e => setWeight(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

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

            {/* Body measurements */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1.5">
                <Ruler className="w-4 h-4" /> Объёмы тела (см)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Грудь", value: chest, setter: setChest },
                  { label: "Талия", value: waist, setter: setWaist },
                  { label: "Ягодицы", value: glutes, setter: setGlutes },
                  { label: "Бедро", value: thigh, setter: setThigh },
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                    <input type="number" step="0.1" placeholder="—" value={value} onChange={e => setter(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-muted-foreground">Качество питания</label>
                <span className="text-sm font-medium text-foreground">{nutritionLabels[nutritionScore]}</span>
              </div>
              <Slider value={[nutritionScore]} onValueChange={v => setNutritionScore(v[0])} min={1} max={10} step={1} />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmitReport}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Анализирую...</>
              ) : (
                <><ClipboardCheck className="w-4 h-4" /> Сдать отчёт</>
              )}
            </button>
          </motion.div>
        </div>

        {/* AI Response */}
        {aiResponse && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="gradient-accent rounded-xl p-5 border border-border/50 space-y-3"
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              🤖 Анализ AI
            </h3>
            <p className="text-sm text-foreground">{aiResponse.summary}</p>
            <ul className="space-y-1.5">
              {aiResponse.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-primary font-medium mt-2">{aiResponse.encouragement}</p>
          </motion.div>
        )}

        {aiError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-destructive/10 rounded-xl p-4 border border-destructive/20"
          >
            <p className="text-sm text-destructive flex items-center gap-2">
              <XCircle className="w-4 h-4" /> {aiError}
            </p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
