import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { TrendingDown, Battery } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DailyReport from "@/components/progress/DailyReport";
import WeeklyReport from "@/components/progress/WeeklyReport";

const weekData = [
  { day: "Пн", weight: 65.2, energy: 7 },
  { day: "Вт", weight: 65.0, energy: 8 },
  { day: "Ср", weight: 64.8, energy: 6 },
  { day: "Чт", weight: 64.9, energy: 7 },
  { day: "Пт", weight: 64.6, energy: 8 },
  { day: "Сб", weight: 64.5, energy: 9 },
  { day: "Вс", weight: 64.4, energy: 7 },
];

export default function Progress() {
  const { profile } = useUser();
  const location = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeMetric, setActiveMetric] = useState<"weight" | "energy">("weight");

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

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">Прогресс</h1>
          <p className="text-muted-foreground mt-1">Отслеживайте изменения</p>
        </motion.div>

        {/* Summary cards — 2 cards */}
        <div className="grid grid-cols-2 gap-3">
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
        </div>

        {/* Metric toggle — no sleep */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {([["weight", "Вес"], ["energy", "Энергия"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveMetric(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeMetric === key ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
              }`}
            >{label}</button>
          ))}
        </div>

        {/* Chart */}
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

        {/* Daily Report */}
        <div ref={reportRef} id="report">
          <DailyReport />
        </div>

        {/* Weekly Report */}
        <WeeklyReport />
      </div>
    </AppLayout>
  );
}
