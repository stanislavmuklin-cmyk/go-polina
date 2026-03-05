import { motion } from "framer-motion";
import { useUser } from "@/context/UserContext";
import { Droplets, Dumbbell, Apple, Pill, TrendingUp, Flame, Target, Zap, ClipboardCheck, CircleHelp } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { TodayWorkoutDialog } from "@/components/dashboard/TodayWorkoutDialog";
import { TodayNutritionDialog } from "@/components/dashboard/TodayNutritionDialog";
import { TodaySupplementsDialog } from "@/components/dashboard/TodaySupplementsDialog";
import { OnboardingTour } from "@/components/OnboardingTour";

const goalLabels: Record<string, string> = {
  "fat-loss": "Похудение", "muscle": "Набор массы", "energy": "Энергия", "skin": "Красота кожи", "anti-stress": "Антистресс"
};

function calcBMR(gender: string, weight: number, height: number, age: number) {
  if (gender === "female") return 10 * weight + 6.25 * height - 5 * age - 161;
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

function calcTDEE(bmr: number, level: string) {
  const multipliers: Record<string, number> = { beginner: 1.375, intermediate: 1.55, advanced: 1.725 };
  return Math.round(bmr * (multipliers[level] || 1.375));
}

function calcTarget(tdee: number, goal: string) {
  if (goal === "fat-loss") return Math.round(tdee * 0.8);
  if (goal === "muscle") return Math.round(tdee * 1.1);
  return tdee;
}

const anim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const { profile, updateProfile, addXP } = useUser();
  const bmr = Math.round(calcBMR(profile.gender, profile.weight, profile.height, profile.age));
  const tdee = calcTDEE(bmr, profile.fitnessLevel);
  const targetCals = calcTarget(tdee, profile.goal);

  const protein = Math.round(profile.weight * (profile.goal === "muscle" ? 2.2 : 1.8));
  const fat = Math.round(targetCals * 0.25 / 9);
  const carbs = Math.round((targetCals - protein * 4 - fat * 9) / 4);

  const waterTarget = 8;

  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [supplementsOpen, setSupplementsOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);

  const drinkWater = () => {
    if (profile.waterGlasses < waterTarget) {
      updateProfile({ waterGlasses: profile.waterGlasses + 1 });
      if (profile.waterGlasses + 1 === waterTarget) addXP(3);
    }
  };

  const todayPlanItems = [
    { icon: Dumbbell, label: "Тренировка", desc: "Силовая · 45 мин", color: "bg-wellness-peach", onClick: () => setWorkoutOpen(true) },
    { icon: Apple, label: "Питание", desc: `${targetCals} ккал · ${protein}г белка`, color: "bg-wellness-green-light", onClick: () => setNutritionOpen(true) },
    { icon: Pill, label: "Добавки", desc: "Витамин D · Омега-3 · Магний", color: "bg-wellness-purple-light", onClick: () => setSupplementsOpen(true) },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Greeting */}
        <motion.div {...anim} transition={{ delay: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Привет, {profile.name} 👋
            </h1>
            <p className="text-muted-foreground mt-1">Ваш персональный план на сегодня</p>
          </div>
          <button
            onClick={() => setTourActive(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs font-medium shrink-0 mt-1"
          >
            <CircleHelp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Как пользоваться</span>
          </button>
        </motion.div>

        {/* Stats cards */}
        <motion.div {...anim} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium">Цель</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{goalLabels[profile.goal]}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-medium">Калории</span>
            </div>
            <p className="text-lg font-bold text-foreground">{targetCals}</p>
            <p className="text-xs text-muted-foreground">ккал/день</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium">Баллы</span>
            </div>
            <p className="text-lg font-bold text-foreground">{profile.xp}</p>
            <p className="text-xs text-muted-foreground">Уровень {profile.level}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Streak</span>
            </div>
            <p className="text-lg font-bold text-foreground">{profile.streak}</p>
            <p className="text-xs text-muted-foreground">дней подряд</p>
          </div>
        </motion.div>

        {/* Macros */}
        <motion.div {...anim} transition={{ delay: 0.15 }} className="bg-card rounded-xl p-5 shadow-soft border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Макронутриенты</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Белки", value: `${protein}г`, color: "bg-primary" },
              { label: "Жиры", value: `${fat}г`, color: "bg-wellness-gold" },
              { label: "Углеводы", value: `${carbs}г`, color: "bg-wellness-blue" },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <div className={`w-10 h-10 rounded-full ${m.color} mx-auto mb-2 flex items-center justify-center`}>
                  <span className="text-xs font-bold text-primary-foreground">{m.value.replace('г','')}</span>
                </div>
                <p className="text-xs font-medium text-foreground">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Water tracker */}
        <motion.div {...anim} transition={{ delay: 0.2 }} className="bg-card rounded-xl p-5 shadow-soft border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-wellness-blue" />
              <h3 className="text-sm font-semibold text-foreground">Вода</h3>
            </div>
            <span className="text-xs text-muted-foreground">{profile.waterGlasses}/{waterTarget} стаканов</span>
          </div>
          <div className="flex gap-2 mb-3">
            {Array.from({ length: waterTarget }).map((_, i) => (
              <div key={i} className={`flex-1 h-8 rounded-lg transition-all ${i < profile.waterGlasses ? "bg-wellness-blue" : "bg-muted"}`} />
            ))}
          </div>
          <button
            onClick={drinkWater}
            disabled={profile.waterGlasses >= waterTarget}
            className="w-full py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/80 transition-colors disabled:opacity-50"
          >
            + Стакан воды
          </button>
        </motion.div>

        {/* Submit Report CTA */}
        <motion.div {...anim} transition={{ delay: 0.22 }} data-tour="submit-report">
          <Link to="/progress#report"
            className="flex items-center gap-4 p-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-soft"
          >
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Сдать отчёт</p>
              <p className="text-xs opacity-80">Ежедневный и еженедельный отчёты</p>
            </div>
          </Link>
        </motion.div>

        {/* Today's plan - dialogs instead of navigation */}
        <motion.div {...anim} transition={{ delay: 0.25 }} className="space-y-3" data-tour="today-plan">
          <h3 className="text-sm font-semibold text-foreground">Сегодняшний план</h3>
          {todayPlanItems.map((item) => (
            <button key={item.label} onClick={item.onClick}
              className={`w-full flex items-center gap-4 p-4 rounded-xl ${item.color} border border-border/50 hover:shadow-soft transition-all text-left`}
            >
              <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-soft">
                <item.icon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </button>
          ))}
        </motion.div>

        {/* Knowledge layer */}
        <motion.div {...anim} transition={{ delay: 0.3 }}
          className="gradient-accent rounded-xl p-5 border border-border/50"
        >
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            🧬 Доказательная база
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            AI работает на основе доказательной нутрициологии: рандомизированные контролируемые исследования (RCT), 
            системные обзоры, физиология и клиническая нутрициология. Все рекомендации основаны на научных данных.
          </p>
        </motion.div>
      </div>

      <TodayWorkoutDialog open={workoutOpen} onOpenChange={setWorkoutOpen} />
      <TodayNutritionDialog open={nutritionOpen} onOpenChange={setNutritionOpen} />
      <TodaySupplementsDialog open={supplementsOpen} onOpenChange={setSupplementsOpen} />
      <OnboardingTour active={tourActive} onClose={() => setTourActive(false)} />
    </AppLayout>
  );
}
