import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Как работает AI-система?", a: "Система анализирует ваши данные (рост, вес, цель, уровень подготовки) и формирует персональные рекомендации по питанию, тренировкам и добавкам на основе доказательной нутрициологии." },
  { q: "Это заменяет визит к врачу?", a: "Нет. Наша система — это инструмент поддержки, а не медицинская консультация. При наличии заболеваний обратитесь к специалисту." },
  { q: "Как начисляются XP?", a: "+10 XP за соблюдение рациона, +5 за тренировку, +3 за водный баланс. Каждые 100 XP — новый уровень." },
  { q: "Могу ли я изменить цель?", a: "Да, вы можете пройти анкету заново через Личный кабинет. Система перестроит все рекомендации." },
  { q: "Как отменить подписку?", a: "Перейдите в Личный кабинет → Управление подпиской. Вы можете отменить в любой момент." },
  { q: "Учитывается ли менструальный цикл?", a: "Да, если вы отметили эту опцию при заполнении анкеты. Система адаптирует питание и тренировки к фазам цикла." },
];

export default function FAQ() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">FAQ</h1>
          </div>
          <p className="text-muted-foreground mt-1">Часто задаваемые вопросы</p>
        </motion.div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="bg-card rounded-xl border border-border shadow-soft px-5">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </AppLayout>
  );
}
