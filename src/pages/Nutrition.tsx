import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import { Apple, ShoppingCart, Clock, Pill, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { generateContent } from "@/lib/ai";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Meal {
  time: string;
  meal: string;
  items: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  prepTime?: string;
}

interface MealDay {
  dayName: string;
  meals: Meal[];
}

interface Supplement {
  name: string;
  dose: string;
  timing: string;
  duration: string;
  reason: string;
}

interface ShoppingCategory {
  category: string;
  items: string[];
}

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const MAX_MEAL_REGEN_PER_DAY = 3;

// Helper to save nutrition data to DB and localStorage
async function saveNutritionToDB(userId: string, field: "meals" | "supplements" | "shopping", value: any) {
  // Save to localStorage as cache
  localStorage.setItem(`ai_${field}`, JSON.stringify(value));

  const { data: existing } = await supabase
    .from("user_nutrition")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("user_nutrition")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
  } else {
    await supabase
      .from("user_nutrition")
      .insert({ user_id: userId, [field]: value });
  }
}

export default function Nutrition() {
  const { profile, addXP, updateProfile } = useUser();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"meals" | "supplements" | "shopping">("meals");
  const completedMealsArr = (profile.completedMeals ?? []) as string[];

  const [mealDays, setMealDays] = useState<MealDay[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [shopping, setShopping] = useState<ShoppingCategory[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);

  const [loadingMeals, setLoadingMeals] = useState(false);
  const [loadingSupplements, setLoadingSupplements] = useState(false);
  const [loadingShopping, setLoadingShopping] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const dataLoadedRef = useRef(false);

  const today = new Date().toISOString().slice(0, 10);
  const regenCount = profile.mealRegenResetDate === today ? (profile.mealRegenCount ?? 0) : 0;
  const regenRemaining = MAX_MEAL_REGEN_PER_DAY - regenCount;

  // Load all nutrition data from DB on mount
  useEffect(() => {
    if (!user || dataLoadedRef.current) return;
    dataLoadedRef.current = true;

    (async () => {
      setInitialLoading(true);
      try {
        const { data } = await supabase
          .from("user_nutrition")
          .select("meals, supplements, shopping")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.meals) {
          setMealDays(data.meals as unknown as MealDay[]);
          localStorage.setItem("ai_meals", JSON.stringify(data.meals));
        }
        if (data?.supplements) {
          setSupplements(data.supplements as unknown as Supplement[]);
          localStorage.setItem("ai_supplements", JSON.stringify(data.supplements));
        }
        if (data?.shopping) {
          setShopping(data.shopping as unknown as ShoppingCategory[]);
          localStorage.setItem("ai_shopping", JSON.stringify(data.shopping));
        }

        // If no meals exist at all, generate them
        if (!data?.meals) {
          await generateAndSaveMeals();
        }
      } catch {
        // Fallback to localStorage
        const cached = localStorage.getItem("ai_meals");
        if (cached) try { setMealDays(JSON.parse(cached)); } catch {}
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateAndSaveMeals = useCallback(async () => {
    if (!user) return;
    setLoadingMeals(true);
    try {
      const data = await generateContent("meals", profile);
      if (data?.days) {
        setMealDays(data.days);
        await saveNutritionToDB(user.id, "meals", data.days);
      }
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации плана питания");
    } finally {
      setLoadingMeals(false);
    }
  }, [profile, user]);

  const generateAndSaveSupplements = useCallback(async () => {
    if (!user) return;
    setLoadingSupplements(true);
    try {
      const data = await generateContent("supplements", profile);
      if (data?.supplements) {
        setSupplements(data.supplements);
        await saveNutritionToDB(user.id, "supplements", data.supplements);
      }
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации добавок");
    } finally {
      setLoadingSupplements(false);
    }
  }, [profile, user]);

  const generateAndSaveShopping = useCallback(async () => {
    if (!user) return;
    setLoadingShopping(true);
    try {
      const data = await generateContent("shopping", profile, { mealPlan: mealDays });
      if (data?.categories) {
        setShopping(data.categories);
        await saveNutritionToDB(user.id, "shopping", data.categories);
      }
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации списка покупок");
    } finally {
      setLoadingShopping(false);
    }
  }, [profile, user, mealDays]);

  // Auto-generate supplements/shopping on first tab visit if empty
  useEffect(() => {
    if (activeTab === "supplements" && supplements.length === 0 && !initialLoading && user) {
      generateAndSaveSupplements();
    }
  }, [activeTab, initialLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === "shopping" && shopping.length === 0 && !initialLoading && user && mealDays.length > 0) {
      generateAndSaveShopping();
    }
  }, [activeTab, mealDays.length, initialLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const regenerateMeal = useCallback(async (dayIdx: number, mealIdx: number) => {
    if (!user) return;
    const currentToday = new Date().toISOString().slice(0, 10);
    const currentCount = profile.mealRegenResetDate === currentToday ? (profile.mealRegenCount ?? 0) : 0;
    if (currentCount >= MAX_MEAL_REGEN_PER_DAY) {
      toast.error(`Лимит замен блюд на сегодня исчерпан (${MAX_MEAL_REGEN_PER_DAY}/${MAX_MEAL_REGEN_PER_DAY})`);
      return;
    }
    const day = mealDays[dayIdx];
    if (!day) return;
    try {
      toast.info("Обновляем блюдо...");
      const data = await generateContent("meals", profile, {
        regenerateSingle: true,
        dayContext: day,
        mealIndex: mealIdx,
      });
      if (data?.days?.[0]?.meals?.[0]) {
        const updated = [...mealDays];
        updated[dayIdx] = {
          ...updated[dayIdx],
          meals: updated[dayIdx].meals.map((m, i) => i === mealIdx ? data.days[0].meals[0] : m),
        };
        setMealDays(updated);
        await saveNutritionToDB(user.id, "meals", updated);
        toast.success("Блюдо обновлено!");
        updateProfile({ mealRegenCount: currentCount + 1, mealRegenResetDate: currentToday });
      }
    } catch (e: any) {
      toast.error(e.message || "Ошибка обновления");
    }
  }, [mealDays, profile, updateProfile, user]);

  const completeMeal = (key: string) => {
    if (!completedMealsArr.includes(key)) {
      updateProfile({ completedMeals: [...completedMealsArr, key] });
      addXP(10);
    }
  };

  const currentDay = mealDays[selectedDay];

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">Питание</h1>
          <p className="text-muted-foreground mt-1">AI-план питания</p>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Day selector */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {mealDays.map((d, i) => (
                <button key={i} onClick={() => setSelectedDay(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedDay === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {(d.dayName || dayNames[i] || `День ${i + 1}`).split(/[\s(–—-]/)[0]}
                </button>
              ))}
            </div>

            <div className="flex items-center">
              <span className="text-xs text-muted-foreground">Замен блюд: {regenRemaining}/{MAX_MEAL_REGEN_PER_DAY}</span>
            </div>

            {(loadingMeals || initialLoading) ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : currentDay ? (
              <div className="space-y-3">
                {currentDay.meals.map((meal, idx) => {
                  const key = `${selectedDay}-${idx}`;
                  return (
                    <div key={idx}
                      className={`bg-card rounded-xl border border-border p-4 shadow-soft transition-all ${completedMeals.has(key) ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs font-mono">{meal.time}</span>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{meal.meal}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => regenerateMeal(selectedDay, idx)}
                            disabled={regenRemaining <= 0}
                            className="p-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
                            title={`Осталось замен: ${regenRemaining}`}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => completeMeal(key)}
                            className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
                              completedMeals.has(key) ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
                            }`}
                          >
                            {completedMeals.has(key) ? "✓" : "Съел"}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {meal.items.map((item, iIdx) => (
                          <span key={iIdx} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md">{item}</span>
                        ))}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{meal.calories} ккал</span>
                        <span>Б: {meal.protein}г</span>
                        <span>Ж: {meal.fat}г</span>
                        <span>У: {meal.carbs}г</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">План питания генерируется...</p>
            )}
          </motion.div>
        )}

        {activeTab === "supplements" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {loadingSupplements ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              supplements.map((s, idx) => (
                <div key={idx} className="bg-card rounded-xl border border-border p-4 shadow-soft">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-foreground">{s.name}</span>
                    <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">{s.dose}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground mb-1">
                    <span>⏰ {s.timing}</span>
                    <span>📅 {s.duration}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.reason}</p>
                </div>
              ))
            )}
            <div className="flex items-start gap-2 bg-muted rounded-xl p-4 border border-border/50">
              <AlertTriangle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Информация о добавках носит ознакомительный характер, не является медицинской рекомендацией и не заменяет консультацию врача. Перед приёмом любых БАД проконсультируйтесь со специалистом.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === "shopping" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {loadingShopping ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              shopping.map((cat, idx) => (
                <div key={idx} className="bg-card rounded-xl border border-border p-5 shadow-soft">
                  <h3 className="text-sm font-semibold text-foreground mb-3">{cat.category}</h3>
                  <div className="space-y-2">
                    {cat.items.map((item, iIdx) => (
                      <label key={iIdx} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
