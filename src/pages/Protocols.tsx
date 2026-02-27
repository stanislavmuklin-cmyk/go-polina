import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { AlertTriangle, BookOpen } from "lucide-react";

const protocols = [
  { name: "Low-FODMAP", desc: "Протокол при СРК и вздутии. Исключение ферментируемых углеводов на 4-6 недель с постепенным реинтродуцированием.", color: "bg-wellness-green-light" },
  { name: "Anti-Candida", desc: "Снижение сахара и дрожжей, поддержка микробиома. Включает пробиотики и антимикотические продукты.", color: "bg-wellness-peach" },
  { name: "Gut Healing", desc: "Восстановление кишечного барьера. L-глутамин, коллаген, костный бульон, исключение раздражителей.", color: "bg-wellness-blue-light" },
  { name: "Безглютеновый", desc: "Полное исключение глютена. Замена на рис, киноа, гречку, кукурузу. Контроль перекрёстного загрязнения.", color: "bg-wellness-warm" },
  { name: "Поддержка щитовидки", desc: "Акцент на селен, цинк, йод. Исключение сои при гипотиреозе. Контроль крестоцветных.", color: "bg-wellness-purple-light" },
];

export default function Protocols() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">Медицинские протоколы</h1>
          </div>
          <p className="text-muted-foreground mt-1">Специализированные программы питания</p>
        </motion.div>

        <div className="flex items-start gap-2 bg-wellness-warm rounded-xl p-4 border border-border/50">
          <AlertTriangle className="w-5 h-5 text-wellness-gold mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Данные протоколы носят информационный характер. Рекомендуется консультация с врачом или нутрициологом перед началом любого протокола.
          </p>
        </div>

        <div className="space-y-3">
          {protocols.map((p, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`${p.color} rounded-xl p-5 border border-border/50 hover:shadow-soft transition-shadow cursor-pointer`}
            >
              <h3 className="text-sm font-semibold text-foreground mb-2">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
