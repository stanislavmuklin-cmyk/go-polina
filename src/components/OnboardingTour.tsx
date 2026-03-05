import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface TourStep {
  target: string; // data-tour value
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "today-plan",
    title: "Сегодняшний план",
    description: "Тут ваша тренировка, питание и добавки на сегодня. Нажмите, чтобы увидеть подробный план.",
  },
  {
    target: "submit-report",
    title: "Сдать отчёт",
    description: "Сдавайте ежедневный и еженедельный отчёты и получайте баллы за дисциплину.",
  },
  {
    target: "nav-progress",
    title: "Прогресс",
    description: "Тут шкалы: вес, объёмы, шаги, сон — все показатели и графики изменений.",
  },
  {
    target: "nav-workouts",
    title: "Тренировки",
    description: "Два формата: для дома и для зала на неделю вперёд. Отмечайте выполненные тренировки.",
  },
  {
    target: "nav-nutrition",
    title: "Питание",
    description: "Блюда под ваш рацион и цель. Отмечайте приёмы пищи и перегенерируйте (3 раза в день).",
  },
  {
    target: "nav-sos",
    title: "SOS",
    description: "Нажмите кнопку ситуации — получите мгновенные рекомендации от AI-консультанта.",
  },
  {
    target: "nav-gamification",
    title: "Достижения",
    description: "Ваши бейджи, прогресс и награды за активность в приложении.",
  },
  {
    target: "nav-showcase",
    title: "Витрина",
    description: "Полезные продукты и инструменты по рекомендации Полины Нагорной.",
  },
  {
    target: "nav-challenges",
    title: "Челленджи",
    description: "Челлендж месяца. Отмечайтесь каждый день, чтобы участвовать и получать баллы.",
  },
  {
    target: "nav-ask-ai",
    title: "AI-агент",
    description: "Ваш личный AI-консультант по здоровью, питанию и тренировкам. Задавайте любые вопросы.",
  },
  {
    target: "nav-faq",
    title: "FAQ",
    description: "Часто задаваемые вопросы — почитайте, чтобы разобраться быстрее.",
  },
  {
    target: "nav-profile",
    title: "Профиль",
    description: "Ваш профиль. Обновите данные, выйдите из аккаунта или удалите профиль.",
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OnboardingTourProps {
  active: boolean;
  onClose: () => void;
}

export const OnboardingTour = ({ active, onClose }: OnboardingTourProps) => {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<"bottom" | "top" | "center">("bottom");
  const resizeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep = TOUR_STEPS[step];
  const isLastStep = step === TOUR_STEPS.length - 1;
  const isFinal = step === TOUR_STEPS.length; // past last = final screen

  const measureElement = useCallback(() => {
    if (isFinal || !currentStep) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const padding = 6;
    setRect({
      top: r.top - padding,
      left: r.left - padding,
      width: r.width + padding * 2,
      height: r.height + padding * 2,
    });

    // Determine tooltip position
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    if (spaceBelow > 200) {
      setTooltipPos("bottom");
    } else if (spaceAbove > 200) {
      setTooltipPos("top");
    } else {
      setTooltipPos("bottom");
    }

    // Scroll element into view if needed
    if (r.top < 0 || r.bottom > window.innerHeight) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Re-measure after scroll
      setTimeout(() => {
        const r2 = el.getBoundingClientRect();
        setRect({
          top: r2.top - padding,
          left: r2.left - padding,
          width: r2.width + padding * 2,
          height: r2.height + padding * 2,
        });
      }, 400);
    }
  }, [step, isFinal, currentStep]);

  useEffect(() => {
    if (!active) return;
    measureElement();

    const handleResize = () => {
      if (resizeRef.current) clearTimeout(resizeRef.current);
      resizeRef.current = setTimeout(measureElement, 100);
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [active, measureElement]);

  const handleNext = () => {
    if (isFinal) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleFinish = () => {
    localStorage.setItem("tour_completed", "true");
    setStep(0);
    onClose();
  };

  if (!active) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]" key="tour-overlay">
        {/* Dark overlay with cutout */}
        {isFinal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ backgroundColor: "hsla(var(--foreground) / 0.75)" }}
          />
        ) : rect ? (
          <>
            {/* Spotlight via box-shadow on a positioned div */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute rounded-xl"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                boxShadow: "0 0 0 9999px hsla(var(--foreground) / 0.75)",
                zIndex: 101,
                pointerEvents: "none",
              }}
            />
            {/* Block clicks outside spotlight */}
            <div className="absolute inset-0" style={{ zIndex: 100 }} onClick={(e) => e.stopPropagation()} />
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ backgroundColor: "hsla(var(--foreground) / 0.75)" }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="absolute bg-card border border-border rounded-2xl p-5 shadow-elevated max-w-sm w-[calc(100vw-2rem)]"
          style={{
            zIndex: 102,
            ...(isFinal
              ? {
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }
              : rect
              ? tooltipPos === "bottom"
                ? {
                    top: rect.top + rect.height + 12,
                    left: Math.max(16, Math.min(rect.left, window.innerWidth - 380)),
                  }
                : {
                    bottom: window.innerHeight - rect.top + 12,
                    left: Math.max(16, Math.min(rect.left, window.innerWidth - 380)),
                  }
              : {
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }),
          }}
        >
          {/* Close button */}
          <button
            onClick={handleFinish}
            className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {isFinal ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-bold text-foreground mb-2">Готово!</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Приятного пользования приложением! Вы всегда можете запустить этот тур снова.
              </p>
              <button
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Начать пользоваться
              </button>
            </div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {step + 1} / {TOUR_STEPS.length}
                </span>
              </div>

              <h3 className="text-base font-bold text-foreground mb-1.5 pr-6">
                {currentStep.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {currentStep.description}
              </p>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleFinish}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Пропустить
                </button>
                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      onClick={handlePrev}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Назад
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    {isLastStep ? "Завершить" : "Далее"}
                    {!isLastStep && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-1 mt-4">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
