import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Dumbbell, Apple, TrendingUp, Shield, Sparkles } from "lucide-react";

const features = [
  { icon: Brain, title: "AI-персонализация", desc: "Интеллектуальная система на основе ваших данных" },
  { icon: Dumbbell, title: "Тренировки", desc: "Адаптивные программы с прогрессией" },
  { icon: Apple, title: "Питание", desc: "Меню, макросы и добавки под вашу цель" },
  { icon: TrendingUp, title: "Прогресс", desc: "Трекинг и корректировки от AI" },
  { icon: Shield, title: "Доказательная база", desc: "RCT, обзоры, физиология" },
  { icon: Sparkles, title: "Геймификация", desc: "XP, уровни и челленджи" },
];

export default function Index() {
  return (
    <div className="min-h-screen gradient-hero">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }} className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
            Закрытый клуб
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight mb-4">
            Wellness<span className="text-primary">AI</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Интеллектуальная система сопровождения здоровья, внешности, энергии и дисциплины
          </p>
          <Link to="/onboarding"
            className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-8 py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-elevated"
          >
            Начать <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((f, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.08 }}
              className="bg-card rounded-xl border border-border p-5 shadow-soft hover:shadow-card transition-shadow"
            >
              <f.icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-center text-xs text-muted-foreground mt-12"
        >
          Не является медицинской рекомендацией · Доказательная нутрициология
        </motion.p>
      </div>
    </div>
  );
}
