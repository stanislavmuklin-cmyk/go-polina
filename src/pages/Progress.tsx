import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { TrendingDown, TrendingUp, Battery, Moon, Ruler } from "lucide-react";
import { useState } from "react";

const weekData = [
  { day: "Пн", weight: 65.2, energy: 7, sleep: 7.5 },
  { day: "Вт", weight: 65.0, energy: 8, sleep: 8 },
  { day: "Ср", weight: 64.8, energy: 6, sleep: 6.5 },
  { day: "Чт", weight: 64.9, energy: 7, sleep: 7 },
  { day: "Пт", weight: 64.6, energy: 8, sleep: 7.5 },
  { day: "Сб", weight: 64.5, energy: 9, sleep: 8.5 },
  { day: "Вс", weight: 64.4, energy: 7, sleep: 7 },
];

export default function Progress() {
  const { profile } = useUser();
  const [activeMetric, setActiveMetric] = useState<"weight" | "energy" | "sleep">("weight");
  const currentWeight = weekData[weekData.length - 1].weight;
  const startWeight = weekData[0].weight;
  const weightChange = (currentWeight - startWeight).toFixed(1);

  const maxVal = Math.max(...weekData.map(d => d[activeMetric]));
  const minVal = Math.min(...weekData.map(d => d[activeMetric]));

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

        {/* AI suggestions */}
        <div className="gradient-accent rounded-xl p-5 border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-2">🤖 Рекомендация AI</h3>
          <p className="text-sm text-muted-foreground">
            Отличная динамика! Вес стабильно снижается. Рекомендую увеличить потребление белка на 10г для сохранения мышечной массы. 
            Качество сна можно улучшить — попробуйте магний за 30 мин до сна.
          </p>
        </div>

        {/* Log entries */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Ruler className="w-4 h-4" /> Записать данные
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {["Вес (кг)", "Энергия (1-10)", "Сон (часы)", "Объём талии (см)"].map((label) => (
              <div key={label}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <input type="number" placeholder="—"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Сохранить
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
