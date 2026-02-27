import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { Trophy, Flame, Star, Award, Target } from "lucide-react";

const badges = [
  { icon: "🏃", name: "Первая тренировка", desc: "Завершить первую тренировку", unlocked: true },
  { icon: "💧", name: "Водный баланс", desc: "8 стаканов воды за день", unlocked: true },
  { icon: "🥗", name: "Чистый рацион", desc: "Соблюдать план 7 дней", unlocked: false },
  { icon: "🔥", name: "Недельный streak", desc: "7 дней подряд", unlocked: false },
  { icon: "💪", name: "Прогресс +1", desc: "Увеличить веса в упражнениях", unlocked: false },
  { icon: "🧘", name: "Баланс", desc: "Завершить 10 тренировок мобильности", unlocked: false },
];

const challenges = [
  { title: "7 дней без сахара", reward: "+50 XP", progress: 3, total: 7 },
  { title: "10 000 шагов/день", reward: "+30 XP", progress: 5, total: 7 },
  { title: "Медитация 5 мин/день", reward: "+20 XP", progress: 1, total: 7 },
];

export default function Gamification() {
  const { profile } = useUser();
  const xpToNext = 100 - (profile.xp % 100);
  const progressPct = ((profile.xp % 100) / 100) * 100;

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">Достижения</h1>
          <p className="text-muted-foreground mt-1">Геймификация и мотивация</p>
        </motion.div>

        {/* Level progress */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card rounded-xl border border-border p-5 shadow-soft"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                <Star className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Уровень {profile.level}</p>
                <p className="text-xs text-muted-foreground">{profile.xp} XP всего</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{xpToNext} XP</p>
              <p className="text-xs text-muted-foreground">до следующего</p>
            </div>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full gradient-primary rounded-full"
            />
          </div>
        </motion.div>

        {/* XP rules */}
        <div className="grid grid-cols-3 gap-3">
          {[{ label: "Рацион", xp: "+10", icon: "🥗" }, { label: "Тренировка", xp: "+5", icon: "💪" }, { label: "Вода", xp: "+3", icon: "💧" }].map((r) => (
            <div key={r.label} className="bg-muted rounded-xl p-3 text-center">
              <span className="text-xl">{r.icon}</span>
              <p className="text-xs font-semibold text-foreground mt-1">{r.xp} XP</p>
              <p className="text-xs text-muted-foreground">{r.label}</p>
            </div>
          ))}
        </div>

        {/* Streak */}
        <div className="bg-wellness-warm rounded-xl p-5 border border-border/50">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-wellness-gold" />
            <div>
              <p className="text-lg font-bold text-foreground">{profile.streak} дней подряд</p>
              <p className="text-xs text-muted-foreground">Не прерывайте серию!</p>
            </div>
          </div>
        </div>

        {/* Challenges */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" /> Активные челленджи
          </h3>
          <div className="space-y-3">
            {challenges.map((ch, idx) => (
              <div key={idx} className="bg-card rounded-xl border border-border p-4 shadow-soft">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{ch.title}</span>
                  <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">{ch.reward}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(ch.progress / ch.total) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{ch.progress}/{ch.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" /> Бейджи
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map((b, idx) => (
              <div key={idx} className={`rounded-xl border border-border p-4 text-center transition-all ${
                b.unlocked ? "bg-card shadow-soft" : "bg-muted opacity-50"
              }`}>
                <span className="text-3xl">{b.icon}</span>
                <p className="text-xs font-semibold text-foreground mt-2">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
