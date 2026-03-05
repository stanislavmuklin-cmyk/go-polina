import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { TrendingDown, Footprints, ClipboardList } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DailyReport from "@/components/progress/DailyReport";
import WeeklyReport from "@/components/progress/WeeklyReport";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const MEASUREMENT_COLORS: Record<string, string> = {
  chest: "hsl(var(--primary))",
  waist: "hsl(var(--destructive))",
  glutes: "hsl(142, 71%, 45%)",
  thigh: "hsl(38, 92%, 50%)",
};

const MEASUREMENT_LABELS: Record<string, string> = {
  chest: "Грудь",
  waist: "Талия",
  glutes: "Ягодицы",
  thigh: "Бедро",
};

export default function Progress() {
  const { profile } = useUser();
  const location = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);

  const [visibleMeasurements, setVisibleMeasurements] = useState<Record<string, boolean>>({
    chest: true, waist: true, glutes: true, thigh: true,
  });

  useEffect(() => {
    if (location.hash === "#report" && reportRef.current) {
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, [location.hash]);

  const weeklyReports = profile.weeklyReports || [];
  const dailyReports = profile.dailyReports || [];

  // Weight change
  const lastWeight = weeklyReports.length > 0 ? weeklyReports[weeklyReports.length - 1].weight : null;
  const prevWeight = weeklyReports.length > 1 ? weeklyReports[weeklyReports.length - 2].weight : null;
  const weightChange = lastWeight != null && prevWeight != null
    ? (lastWeight - prevWeight).toFixed(1)
    : null;

  // Avg steps last 7 days
  const recentDailyReports = dailyReports.slice(-7);
  const avgSteps = recentDailyReports.length > 0
    ? Math.round(recentDailyReports.reduce((s, r) => s + (r.steps || 0), 0) / recentDailyReports.length)
    : null;

  // Chart data
  const weightData = weeklyReports
    .filter(r => r.weight != null)
    .map(r => ({
      date: format(parseISO(r.date), "d MMM", { locale: ru }),
      weight: r.weight,
    }));

  const measurementData = weeklyReports.map(r => ({
    date: format(parseISO(r.date), "d MMM", { locale: ru }),
    chest: r.chest, waist: r.waist, glutes: r.glutes, thigh: r.thigh,
  }));

  const stepsData = dailyReports.map(r => ({
    date: format(parseISO(r.date), "d MMM", { locale: ru }),
    steps: r.steps || 0,
  }));

  const sleepData = dailyReports.map(r => ({
    date: format(parseISO(r.date), "d MMM", { locale: ru }),
    sleep: r.sleep || 0,
  }));

  const toggleMeasurement = (key: string) => {
    setVisibleMeasurements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasWeeklyData = weeklyReports.length > 0;
  const hasDailyData = dailyReports.length > 0;

  const EmptyState = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ClipboardList className="w-10 h-10 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">Прогресс</h1>
          <p className="text-muted-foreground mt-1">Отслеживайте изменения</p>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border text-center">
            <TrendingDown className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-lg font-bold text-foreground">
              {weightChange != null ? `${Number(weightChange) > 0 ? "+" : ""}${weightChange} кг` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Изменение веса</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border text-center">
            <Footprints className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-lg font-bold text-foreground">
              {avgSteps != null ? avgSteps.toLocaleString("ru-RU") : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Шагов/день (ср.)</p>
          </div>
        </div>

        {/* Tabs with charts */}
        <Tabs defaultValue="weight" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="weight">Вес</TabsTrigger>
            <TabsTrigger value="measurements">Объёмы</TabsTrigger>
            <TabsTrigger value="steps">Шаги</TabsTrigger>
            <TabsTrigger value="sleep">Сон</TabsTrigger>
          </TabsList>

          <TabsContent value="weight">
            <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
              {!hasWeeklyData || weightData.length === 0 ? (
                <EmptyState text="Сдайте еженедельный отчёт, чтобы увидеть график веса" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} />
                    <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Вес (кг)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="measurements">
            <div className="bg-card rounded-xl border border-border p-4 shadow-soft space-y-3">
              {!hasWeeklyData ? (
                <EmptyState text="Сдайте еженедельный отчёт, чтобы увидеть объёмы" />
              ) : (
                <>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(MEASUREMENT_LABELS).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox
                          checked={visibleMeasurements[key]}
                          onCheckedChange={() => toggleMeasurement(key)}
                          style={{ borderColor: MEASUREMENT_COLORS[key] }}
                        />
                        <span style={{ color: MEASUREMENT_COLORS[key] }}>{label}</span>
                      </label>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={measurementData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} />
                      {Object.entries(MEASUREMENT_LABELS).map(([key, label]) =>
                        visibleMeasurements[key] ? (
                          <Line key={key} type="monotone" dataKey={key} stroke={MEASUREMENT_COLORS[key]} strokeWidth={2} dot={{ r: 3 }} name={`${label} (см)`} />
                        ) : null
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="steps">
            <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
              {!hasDailyData || stepsData.length === 0 ? (
                <EmptyState text="Сдайте ежедневный отчёт, чтобы увидеть шаги" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stepsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} />
                    <Bar dataKey="steps" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Шаги" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sleep">
            <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
              {!hasDailyData || sleepData.length === 0 ? (
                <EmptyState text="Сдайте ежедневный отчёт, чтобы увидеть данные сна" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sleepData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} />
                    <Bar dataKey="sleep" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Сон (ч)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
