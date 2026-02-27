import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Zap } from "lucide-react";

const sosItems = [
  { emoji: "🍫", title: "Хочется сладкого", protocol: "Выпейте стакан воды с лимоном. Съешьте горсть орехов или тёмный шоколад (70%+). Подождите 15 минут — тяга уйдёт." },
  { emoji: "🤢", title: "Вздутие", protocol: "Откажитесь от крестоцветных овощей на 2 дня. Выпейте мятный чай. Попробуйте активированный уголь или ферменты." },
  { emoji: "😴", title: "Усталость", protocol: "Проверьте гидратацию (минимум 8 стаканов). Съешьте источник быстрых углеводов (банан). 10 минут на свежем воздухе." },
  { emoji: "🍕", title: "Переела", protocol: "Не паникуйте. Следующий приём пищи — обычный. Добавьте 20 мин прогулки. Пейте воду. Один день не определяет результат." },
  { emoji: "😤", title: "ПМС / раздражительность", protocol: "Увеличьте магний до 600 мг. Добавьте тёплый травяной чай. Снизьте интенсивность тренировки. Углеводы чуть выше нормы — это нормально." },
  { emoji: "💔", title: "Срыв", protocol: "Срыв — это не провал. Запишите, что произошло. Вернитесь к плану со следующего приёма пищи. Вы не потеряли прогресс." },
];

export default function SOS() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-wellness-gold" />
            <h1 className="font-display text-2xl font-bold text-foreground">SOS-режим</h1>
          </div>
          <p className="text-muted-foreground mt-1">Быстрые решения для частых проблем</p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2">
          {sosItems.map((item, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card rounded-xl border border-border p-5 shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{item.emoji}</span>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.protocol}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
