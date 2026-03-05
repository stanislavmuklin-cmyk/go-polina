import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

const goals = [
  { value: "fat-loss", label: "Похудение", emoji: "🔥", desc: "Снижение веса с сохранением мышц" },
  { value: "muscle", label: "Набор массы", emoji: "💪", desc: "Увеличение мышечной массы и силы" },
  { value: "energy", label: "Энергия", emoji: "⚡", desc: "Повышение жизненного тонуса" },
  { value: "skin", label: "Красота кожи", emoji: "✨", desc: "Улучшение состояния кожи и волос" },
  { value: "anti-stress", label: "Антистресс", emoji: "🧘", desc: "Снижение стресса и тревожности" },
] as const;

const fitnessLevels = [
  { value: "beginner", label: "Новичок", desc: "Только начинаю" },
  { value: "intermediate", label: "Средний", desc: "Занимаюсь регулярно" },
  { value: "advanced", label: "Продвинутый", desc: "Опытный атлет" },
] as const;

const dietOptions = ["Веган", "Вегетарианец", "Без глютена", "Без лактозы", "Халяль", "Кето"];


const workoutLocations = [
  { value: "gym", label: "Зал", emoji: "🏋️" },
  { value: "home", label: "Дома", emoji: "🏠" },
] as const;

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const { updateProfile, setIsOnboarded } = useUser();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("female");
  const [age, setAge] = useState("30");
  const [height, setHeight] = useState("165");
  const [weight, setWeight] = useState("65");
  const [fitnessLevel, setFitnessLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [workoutLocation, setWorkoutLocation] = useState<"gym" | "home">("gym");
  const [goal, setGoal] = useState<typeof goals[number]["value"]>("fat-loss");
  const [consentMedical, setConsentMedical] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [dietPreferences, setDietPreferences] = useState<string[]>([]);
  const [trackCycle, setTrackCycle] = useState(false);
  const [complaints, setComplaints] = useState("");

  const totalSteps = 6;

  const toggleDiet = (d: string) => {
    setDietPreferences((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const finish = () => {
    updateProfile({
      name, gender, age: Number(age), height: Number(height), weight: Number(weight),
      fitnessLevel, workoutLocation, goal, dietType: "no-restriction", dietPreferences, trackCycle, complaints, xp: 0, level: 1, streak: 1,
    });
    setIsOnboarded(true);
    navigate("/dashboard");
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    return true;
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-card rounded-2xl shadow-elevated p-6 md:p-8"
      >
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Добро пожаловать</h2>
                  <p className="text-muted-foreground mt-1">Расскажите о себе для персонализации</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Имя</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Пол</label>
                    <div className="flex gap-2">
                      {([["female", "Женский"], ["male", "Мужской"], ["other", "Другой"]] as const).map(([val, label]) => (
                        <button key={val} onClick={() => setGender(val)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                            gender === val ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Возраст</label>
                    <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Параметры тела</h2>
                  <p className="text-muted-foreground mt-1">Для точного расчёта калорий и нутриентов</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Рост (см)</label>
                    <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Вес (кг)</label>
                    <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
                  </div>
                  {gender === "female" && (
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={trackCycle} onChange={(e) => setTrackCycle(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                        <span className="text-sm text-foreground">Учитывать менструальный цикл</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Ваша цель</h2>
                  <p className="text-muted-foreground mt-1">Выберите основной фокус</p>
                </div>
                <div className="grid gap-2">
                  {goals.map((g) => (
                    <button key={g.value} onClick={() => setGoal(g.value)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all border ${
                        goal === g.value ? "border-primary bg-accent shadow-soft" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span className="text-xl">{g.emoji}</span>
                      <div>
                        <span className="text-sm font-medium text-foreground">{g.label}</span>
                        <p className="text-xs text-muted-foreground">{g.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Уровень и тренировки</h2>
                  <p className="text-muted-foreground mt-1">Настроим программу под вас</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Физическая подготовка</label>
                    <div className="grid gap-2">
                      {fitnessLevels.map((fl) => (
                        <button key={fl.value} onClick={() => setFitnessLevel(fl.value)}
                          className={`p-3 rounded-xl text-left transition-all border ${
                            fitnessLevel === fl.value ? "border-primary bg-accent" : "border-border hover:border-primary/30"
                          }`}
                        >
                          <span className="text-sm font-medium text-foreground">{fl.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{fl.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Где тренируетесь?</label>
                    <div className="flex gap-2">
                      {workoutLocations.map((wl) => (
                        <button key={wl.value} onClick={() => setWorkoutLocation(wl.value)}
                          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all border ${
                            workoutLocation === wl.value ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          <span>{wl.emoji}</span> {wl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Питание</h2>
                  <p className="text-muted-foreground mt-1">Укажите ограничения, если есть</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Ограничения и аллергии</label>
                  <div className="flex flex-wrap gap-2">
                    {dietOptions.map((d) => (
                      <button key={d} onClick={() => toggleDiet(d)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                          dietPreferences.includes(d) ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >{d}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Жалобы и симптомы</h2>
                  <p className="text-muted-foreground mt-1">Опишите, что беспокоит (необязательно)</p>
                </div>
                <textarea
                  value={complaints}
                  onChange={(e) => setComplaints(e.target.value)}
                  placeholder="Усталость, вздутие, проблемы со сном..."
                  className="w-full h-32 rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={consentMedical} onChange={(e) => setConsentMedical(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      Я понимаю, что рекомендации носят ознакомительный характер, не являются медицинской рекомендацией и не заменяют консультацию врача.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={consentData} onChange={(e) => setConsentData(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      Я даю согласие на обработку введённых данных для персонализации рекомендаций.
                    </span>
                  </label>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Назад
            </Button>
          ) : <div />}
          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-2">
              Далее <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={!consentMedical || !consentData} className="gap-2">
              <Sparkles className="w-4 h-4" /> Начать
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
