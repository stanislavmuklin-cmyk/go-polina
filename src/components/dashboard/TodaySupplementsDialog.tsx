import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill } from "lucide-react";
import { Link } from "react-router-dom";

interface Supplement {
  name: string;
  dose: string;
  timing: string;
  duration: string;
  reason: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function TodaySupplementsDialog({ open, onOpenChange }: Props) {
  const [supplements, setSupplements] = useState<Supplement[]>([]);

  useEffect(() => {
    if (!open) return;
    const cached = localStorage.getItem("ai_supplements");
    if (cached) {
      try { setSupplements(JSON.parse(cached)); } catch { setSupplements([]); }
    } else {
      setSupplements([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" /> Добавки на сегодня
          </DialogTitle>
        </DialogHeader>

        {supplements.length > 0 ? (
          <div className="mt-2 space-y-3">
            {supplements.map((s, idx) => (
              <div key={idx} className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">{s.name}</span>
                  <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">{s.dose}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mb-1">
                  <span>⏰ {s.timing}</span>
                  <span>📅 {s.duration}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.reason}</p>
              </div>
            ))}
            <div className="flex items-start gap-2 bg-muted rounded-xl p-3 border border-border/50 mt-2">
              <p className="text-xs text-muted-foreground">
                Информация о добавках носит ознакомительный характер, не является медицинской рекомендацией и не заменяет консультацию врача. Перед приёмом любых БАД проконсультируйтесь со специалистом.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-muted-foreground">Рекомендации по добавкам ещё не загружены</p>
            <Link to="/nutrition" onClick={() => onOpenChange(false)}
              className="text-sm text-primary hover:underline">
              Перейти в Питание →
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
