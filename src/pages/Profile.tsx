import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut, Trash2, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const goalLabels: Record<string, string> = {
  "fat-loss": "Похудение", "muscle": "Набор массы", "energy": "Энергия", "skin": "Красота кожи", "anti-stress": "Антистресс"
};
const levelLabels: Record<string, string> = {
  beginner: "Новичок", intermediate: "Средний", advanced: "Продвинутый"
};

export default function Profile() {
  const { profile, setIsOnboarded, updateProfile } = useUser();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const resetProfile = () => {
    updateProfile({
      name: "", gender: "female", age: 30, height: 165, weight: 65,
      fitnessLevel: "beginner", goal: "fat-loss", dietPreferences: [], dietType: "no-restriction",
      workoutLocation: "gym", equipment: [], trackCycle: false, complaints: "",
      xp: 0, level: 1, streak: 0, completedWorkouts: [], waterGlasses: 0,
      completedMeals: [], completedSupplements: [], dailyReports: [],
    });
    setIsOnboarded(false);
    navigate("/");
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch {
      toast.error("Ошибка при выходе");
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("profiles").delete().eq("user_id", user.id);
      if (error) throw error;
      await signOut();
      navigate("/");
      toast.success("Профиль удалён");
    } catch {
      toast.error("Не удалось удалить профиль");
    } finally {
      setDeleting(false);
    }
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
              <p className="text-sm text-muted-foreground">Уровень {profile.level} · {profile.xp} баллов</p>
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
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-muted transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Сбросить профиль и пройти анкету заново
          </button>

          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти из аккаунта
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-card text-sm text-destructive hover:bg-destructive/5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Удалить профиль
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить профиль?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие необратимо. Все ваши данные, прогресс и достижения будут удалены навсегда.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteProfile}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Удаление..." : "Удалить навсегда"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="bg-muted rounded-xl p-4">
          <p className="text-xs text-muted-foreground">
            🔒 Ваши данные хранятся в защищённом облаке и не передаются третьим лицам.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
