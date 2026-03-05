import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, Loader2, Swords } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";

interface Challenge {
  id?: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  xp_reward: number;
  is_active: boolean;
}

export function ChallengesTab() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .order("start_date", { ascending: false });
    if (data) setChallenges(data as Challenge[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const addChallenge = () => {
    const today = new Date().toISOString().split("T")[0];
    const end = new Date(Date.now() + 20 * 86400000).toISOString().split("T")[0];
    setChallenges((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        start_date: today,
        end_date: end,
        duration_days: 21,
        xp_reward: 50,
        is_active: true,
      },
    ]);
  };

  const updateChallenge = (idx: number, field: keyof Challenge, value: any) => {
    setChallenges((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        const updated = { ...c, [field]: value };
        if (field === "start_date" || field === "end_date") {
          if (updated.start_date && updated.end_date) {
            const diff = differenceInDays(parseISO(updated.end_date), parseISO(updated.start_date)) + 1;
            updated.duration_days = Math.max(1, diff);
          }
        }
        return updated;
      })
    );
  };

  const removeChallenge = async (idx: number) => {
    const c = challenges[idx];
    if (c.id) {
      await supabase.from("challenges").delete().eq("id", c.id);
    }
    setChallenges((prev) => prev.filter((_, i) => i !== idx));
    toast.success("Челлендж удалён");
  };

  const saveAll = async () => {
    if (!user) return;
    setSaving(true);
    try {
      for (const c of challenges) {
        const row = {
          title: c.title,
          description: c.description,
          start_date: c.start_date,
          end_date: c.end_date,
          duration_days: c.duration_days,
          xp_reward: c.xp_reward,
          is_active: c.is_active,
          created_by: user.id,
        };
        if (c.id) {
          const { error } = await supabase.from("challenges").update(row).eq("id", c.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("challenges").insert(row);
          if (error) throw error;
        }
      }
      toast.success("Челленджи сохранены!");
      loadChallenges();
    } catch (e: any) {
      toast.error(e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {challenges.map((c, idx) => (
        <Card key={c.id || `new-${idx}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-primary" />
                <span>{c.title || "Новый челлендж"}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`active-${idx}`} className="text-xs text-muted-foreground">
                    Активен
                  </Label>
                  <Switch
                    id={`active-${idx}`}
                    checked={c.is_active}
                    onCheckedChange={(v) => updateChallenge(idx, "is_active", v)}
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeChallenge(idx)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Название</Label>
              <Input
                value={c.title}
                onChange={(e) => updateChallenge(idx, "title", e.target.value)}
                placeholder="Например: 21 день без сахара"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Описание</Label>
              <Textarea
                value={c.description}
                onChange={(e) => updateChallenge(idx, "description", e.target.value)}
                placeholder="Описание челленджа..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Дата начала</Label>
                <Input
                  type="date"
                  value={c.start_date}
                  onChange={(e) => updateChallenge(idx, "start_date", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Дата окончания</Label>
                <Input
                  type="date"
                  value={c.end_date}
                  onChange={(e) => updateChallenge(idx, "end_date", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Дней</Label>
                <Input type="number" value={c.duration_days} readOnly className="bg-muted" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">XP награда</Label>
                <Input
                  type="number"
                  value={c.xp_reward}
                  onChange={(e) => updateChallenge(idx, "xp_reward", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full" onClick={addChallenge}>
        <Plus className="w-4 h-4 mr-1" /> Добавить челлендж
      </Button>

      <Button onClick={saveAll} disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Сохранить челленджи
      </Button>
    </div>
  );
}
