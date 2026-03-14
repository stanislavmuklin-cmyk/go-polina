import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";

interface Analysis {
  id?: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export function AnalysesTab() {
  const { user } = useAuth();
  const [items, setItems] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("analyses")
      .select("*")
      .order("sort_order");
    if (data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = () =>
    setItems((prev) => [
      ...prev,
      { title: "", description: "", sort_order: prev.length, is_active: true },
    ]);

  const update = (idx: number, field: keyof Analysis, value: any) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  const remove = async (idx: number) => {
    const item = items[idx];
    if (item.id) await supabase.from("analyses").delete().eq("id", item.id);
    setItems((prev) => prev.filter((_, i) => i !== idx));
    toast.success("Удалено");
  };

  const saveAll = async () => {
    setSaving(true);
    for (let i = 0; i < items.length; i++) {
      const { id, ...rest } = items[i];
      const row = { ...rest, sort_order: i, created_by: user?.id ?? null };
      if (id) {
        await supabase.from("analyses").update(row).eq("id", id);
      } else {
        await supabase.from("analyses").insert(row);
      }
    }
    toast.success("Сохранено");
    await load();
    setSaving(false);
  };

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <Card key={item.id ?? `new-${idx}`}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.is_active}
                  onCheckedChange={(v) => update(idx, "is_active", v)}
                />
                <Label className="text-xs text-muted-foreground">
                  {item.is_active ? "Активен" : "Скрыт"}
                </Label>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(idx)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <Input
              placeholder="Название анализа"
              value={item.title}
              onChange={(e) => update(idx, "title", e.target.value)}
            />
            <Textarea
              placeholder="Описание"
              value={item.description}
              onChange={(e) => update(idx, "description", e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full" onClick={add}>
        <Plus className="w-4 h-4 mr-2" /> Добавить анализ
      </Button>
      <Button className="w-full" onClick={saveAll} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Сохранить
      </Button>
    </div>
  );
}
