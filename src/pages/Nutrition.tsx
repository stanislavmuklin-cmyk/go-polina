import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { Apple, ShoppingCart, Clock, Pill, AlertTriangle } from "lucide-react";
import { useState } from "react";

const mealPlan = [
  { time: "08:00", meal: "Завтрак", items: ["Овсянка с ягодами", "2 яйца", "Авокадо тост"], cals: 450 },
  { time: "11:00", meal: "Перекус", items: ["Греческий йогурт", "Горсть миндаля"], cals: 200 },
  { time: "13:30", meal: "Обед", items: ["Куриная грудка 150г", "Бурый рис", "Овощной салат"], cals: 550 },
  { time: "16:00", meal: "Перекус", items: ["Протеиновый коктейль", "Банан"], cals: 250 },
  { time: "19:00", meal: "Ужин", items: ["Лосось 150г", "Киноа", "Брокколи на пару"], cals: 500 },
];

const supplements = [
  { name: "Витамин D3", dose: "2000 МЕ", timing: "Утром с едой", duration: "3 месяца" },
  { name: "Омега-3", dose: "1000 мг", timing: "С обедом", duration: "Постоянно" },
  { name: "Магний цитрат", dose: "400 мг", timing: "Перед сном", duration: "2 месяца" },
  { name: "Витамин C", dose: "500 мг", timing: "Утром", duration: "1 месяц" },
];

const shoppingList = ["Овсянка", "Ягоды (замороженные)", "Яйца (10шт)", "Авокадо", "Хлеб цельнозерновой", "Греческий йогурт", "Миндаль", "Куриная грудка 1кг", "Бурый рис", "Лосось 500г", "Киноа", "Брокколи", "Бананы", "Протеин"];

export default function Nutrition() {
  const { profile, addXP } = useUser();
  const [activeTab, setActiveTab] = useState<"meals" | "supplements" | "shopping">("meals");
  const [completedMeals, setCompletedMeals] = useState<Set<number>>(new Set());

  const completeMeal = (idx: number) => {
    if (!completedMeals.has(idx)) {
      setCompletedMeals((prev) => new Set(prev).add(idx));
      addXP(10);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">Питание</h1>
          <p className="text-muted-foreground mt-1">Персональный план питания</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {([["meals", "Рацион", Apple], ["supplements", "Добавки", Pill], ["shopping", "Покупки", ShoppingCart]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === key ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {activeTab === "meals" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {mealPlan.map((meal, idx) => (
              <div key={idx}
                className={`bg-card rounded-xl border border-border p-4 shadow-soft transition-all ${completedMeals.has(idx) ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-mono">{meal.time}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{meal.meal}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{meal.cals} ккал</span>
                    <button onClick={() => completeMeal(idx)}
                      className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
                        completedMeals.has(idx) ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
                      }`}
                    >
                      {completedMeals.has(idx) ? "✓" : "Съел"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {meal.items.map((item, iIdx) => (
                    <span key={iIdx} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "supplements" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {supplements.map((s, idx) => (
              <div key={idx} className="bg-card rounded-xl border border-border p-4 shadow-soft">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">{s.name}</span>
                  <span className="text-xs bg-wellness-purple-light text-foreground px-2 py-1 rounded-full">{s.dose}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>⏰ {s.timing}</span>
                  <span>📅 {s.duration}</span>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-2 bg-wellness-warm rounded-xl p-4 border border-border/50">
              <AlertTriangle className="w-4 h-4 text-wellness-gold mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Информация о добавках не является медицинской рекомендацией. Проконсультируйтесь со специалистом.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === "shopping" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card rounded-xl border border-border p-5 shadow-soft"
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">Список покупок на неделю</h3>
            <div className="space-y-2">
              {shoppingList.map((item, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">{item}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
