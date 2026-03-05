import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { Zap, X, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { generateContent } from "@/lib/ai";
import { toast } from "sonner";

const sosItems = [
  { emoji: "🍫", title: "Хочется сладкого" },
  { emoji: "🤢", title: "Вздутие" },
  { emoji: "😴", title: "Усталость" },
  { emoji: "🍕", title: "Переела" },
  { emoji: "😤", title: "ПМС / раздражительность" },
  { emoji: "💔", title: "Срыв" },
];

interface SOSResponse {
  title: string;
  steps: string[];
  supplements?: string[];
  note?: string;
}

export default function SOS() {
  const { profile } = useUser();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SOSResponse | null>(null);

  const openSOS = useCallback(async (idx: number) => {
    setSelectedIdx(idx);
    setResponse(null);
    setLoading(true);
    try {
      const data = await generateContent("sos", profile, { topic: sosItems[idx].title });
      setResponse(data as SOSResponse);
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации протокола");
      setSelectedIdx(null);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const close = () => {
    setSelectedIdx(null);
    setResponse(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">SOS-режим</h1>
          </div>
          <p className="text-muted-foreground mt-1">Нажмите для AI-протокола под ваш профиль</p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2">
          {sosItems.map((item, idx) => (
            <motion.button key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => openSOS(idx)}
              className="bg-card rounded-xl border border-border p-5 shadow-soft hover:shadow-card hover:border-primary/30 transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{item.emoji}</span>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Modal/Drawer */}
        {selectedIdx !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={close}
          >
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-card rounded-2xl border border-border shadow-elevated p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{sosItems[selectedIdx].emoji}</span>
                  <h2 className="font-display text-lg font-bold text-foreground">{sosItems[selectedIdx].title}</h2>
                </div>
                <button onClick={close} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Генерируем протокол...</p>
                </div>
              ) : response ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Шаги:</h3>
                    <ol className="space-y-2">
                      {response.steps.map((step, i) => (
                        <li key={i} className="flex gap-2 text-sm text-foreground">
                          <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  {response.supplements && response.supplements.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">Добавки:</h3>
                      <ul className="space-y-1">
                        {response.supplements.map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground">💊 {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-start gap-2 bg-muted rounded-xl p-3 border border-border/50">
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Информация о добавках носит ознакомительный характер, не является медицинской рекомендацией и не заменяет консультацию врача. Перед приёмом любых БАД проконсультируйтесь со специалистом.
                    </p>
                  </div>
                  {response.note && (
                    <div className="bg-muted rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">💡 {response.note}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
