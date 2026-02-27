import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { User, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const goalLabels: Record<string, string> = {
  "fat-loss": "Похудение", "muscle": "Набор массы", "energy": "Энергия", "skin": "Красота кожи", "anti-stress": "Антистресс"
};
const levelLabels: Record<string, string> = {
  beginner: "Новичок", intermediate: "Средний", advanced: "Продвинутый"
};

export default function Profile() {
  const { profile, setIsOnboarded } = useUser();
  const navigate = useNavigate();

  const resetProfile = () => {
    localStorage.clear();
    setIsOnboarded(false);
    navigate("/");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">Личный кабинет</h1>
        </motion.div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">Уровень {profile.level} · {profile.xp} XP</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ["Пол", profile.gender === "female" ? "Женский" : profile.gender === "male" ? "Мужской" : "Другой"],
              ["Возраст", `${profile.age} лет`],
              ["Рост", `${profile.height} см`],
              ["Вес", `${profile.weight} кг`],
              ["Уровень", levelLabels[profile.fitnessLevel]],
              ["Цель", goalLabels[profile.goal]],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-muted-foreground text-xs">{label}</p>
                <p className="font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {profile.dietPreferences.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-1">Питание</p>
              <div className="flex flex-wrap gap-1">
                {profile.dietPreferences.map((d) => (
                  <span key={d} className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">{d}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button onClick={resetProfile}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card text-sm text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Сбросить профиль и пройти анкету заново
          </button>
        </div>

        <div className="bg-muted rounded-xl p-4">
          <p className="text-xs text-muted-foreground">
            🔒 Ваши данные хранятся локально на устройстве и не передаются третьим лицам.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
