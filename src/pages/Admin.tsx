import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, Save, Building2, Home, UserPlus, Shield, Loader2 } from "lucide-react";

const DAYS = [
  { name: "Пн", sort: 0 },
  { name: "Вт", sort: 1 },
  { name: "Ср", sort: 2 },
  { name: "Чт", sort: 3 },
  { name: "Пт", sort: 4 },
  { name: "Сб", sort: 5 },
  { name: "Вс", sort: 6 },
];

interface Exercise {
  name: string;
  sets: string;
}

interface DayPlan {
  day: string;
  type: string;
  exercises: Exercise[];
  sort_order: number;
}

const emptyWeek = (): DayPlan[] =>
  DAYS.map((d) => ({ day: d.name, type: "", exercises: [], sort_order: d.sort }));

export default function Admin() {
  const { user } = useAuth();
  const [location, setLocation] = useState<"gym" | "home">("gym");
  const [week, setWeek] = useState<DayPlan[]>(emptyWeek());
  const [saving, setSaving] = useState(false);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);

  // Co-admins
  const [admins, setAdmins] = useState<{ user_id: string; email: string }[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const loadWorkouts = useCallback(async (loc: string) => {
    setLoadingWorkouts(true);
    const { data } = await supabase
      .from("admin_workouts")
      .select("*")
      .eq("location", loc)
      .order("sort_order");

    if (data && data.length > 0) {
      setWeek(
        DAYS.map((d) => {
          const row = data.find((r: any) => r.day === d.name);
          return {
            day: d.name,
            type: row?.type || "",
            exercises: (row?.exercises as unknown as Exercise[]) || [],
            sort_order: d.sort,
          };
        })
      );
    } else {
      setWeek(emptyWeek());
    }
    setLoadingWorkouts(false);
  }, []);

  useEffect(() => {
    loadWorkouts(location);
  }, [location, loadWorkouts]);

  useEffect(() => {
    const loadAdmins = async () => {
      const { data } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      if (data) {
        // We can't query auth.users directly, so just show user_ids
        setAdmins(data.map((r: any) => ({ user_id: r.user_id, email: "" })));
      }
    };
    loadAdmins();
  }, []);

  const saveWorkouts = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Delete existing for this location, then insert
      await supabase.from("admin_workouts").delete().eq("location", location);

      const rows = week.map((d) => ({
        location,
        day: d.day,
        type: d.type,
        exercises: d.exercises as any,
        sort_order: d.sort_order,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("admin_workouts").insert(rows);
      if (error) throw error;
      toast.success("Тренировки сохранены!");
    } catch (e: any) {
      toast.error(e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (idx: number, field: keyof DayPlan, value: any) => {
    setWeek((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)));
  };

  const addExercise = (dayIdx: number) => {
    setWeek((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { ...d, exercises: [...d.exercises, { name: "", sets: "" }] } : d
      )
    );
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    setWeek((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) } : d
      )
    );
  };

  const updateExercise = (dayIdx: number, exIdx: number, field: keyof Exercise, value: string) => {
    setWeek((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              exercises: d.exercises.map((ex, j) =>
                j === exIdx ? { ...ex, [field]: value } : ex
              ),
            }
          : d
      )
    );
  };

  const inviteAdmin = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { error } = await supabase
        .from("admin_invites")
        .insert({ email: inviteEmail.trim(), invited_by: user?.id });
      if (error) throw error;
      toast.success(`Приглашение отправлено: ${inviteEmail}`);
      setInviteEmail("");
    } catch (e: any) {
      toast.error(e.message || "Ошибка приглашения");
    } finally {
      setInviting(false);
    }
  };

  const removeAdmin = async (userId: string) => {
    try {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      setAdmins((prev) => prev.filter((a) => a.user_id !== userId));
      toast.success("Администратор удалён");
    } catch (e: any) {
      toast.error(e.message || "Ошибка удаления");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Админ-панель</h1>
          <p className="text-muted-foreground mt-1">Управление контентом приложения</p>
        </div>

        <Tabs defaultValue="workouts">
          <TabsList className="w-full">
            <TabsTrigger value="workouts" className="flex-1">Тренировки</TabsTrigger>
            <TabsTrigger value="admins" className="flex-1">Администраторы</TabsTrigger>
          </TabsList>

          <TabsContent value="workouts" className="space-y-4 mt-4">
            {/* Location toggle */}
            <div className="flex gap-2">
              {([["gym", "Зал", Building2], ["home", "Дома", Home]] as const).map(
                ([val, label, Icon]) => (
                  <button
                    key={val}
                    onClick={() => setLocation(val)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      location === val
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                )
              )}
            </div>

            {loadingWorkouts ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {week.map((day, dayIdx) => (
                  <Card key={day.day}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{day.day}</span>
                        <Input
                          value={day.type}
                          onChange={(e) => updateDay(dayIdx, "type", e.target.value)}
                          placeholder="Тип (Силовая, Кардио, Отдых...)"
                          className="max-w-[250px] h-8 text-sm"
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {day.exercises.map((ex, exIdx) => (
                        <div key={exIdx} className="flex gap-2 items-center">
                          <Input
                            value={ex.name}
                            onChange={(e) => updateExercise(dayIdx, exIdx, "name", e.target.value)}
                            placeholder="Упражнение"
                            className="flex-1 h-8 text-sm"
                          />
                          <Input
                            value={ex.sets}
                            onChange={(e) => updateExercise(dayIdx, exIdx, "sets", e.target.value)}
                            placeholder="3×12"
                            className="w-24 h-8 text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => removeExercise(dayIdx, exIdx)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1"
                        onClick={() => addExercise(dayIdx)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Добавить упражнение
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={saveWorkouts} disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Сохранить тренировки
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="admins" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Текущие администраторы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {admins.map((a) => (
                  <div key={a.user_id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground font-mono">{a.user_id.slice(0, 8)}…</span>
                    </div>
                    {a.user_id !== user?.id && (
                      <Button variant="ghost" size="sm" onClick={() => removeAdmin(a.user_id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {admins.length === 0 && (
                  <p className="text-sm text-muted-foreground">Нет администраторов</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Пригласить администратора</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@example.com"
                    type="email"
                    className="flex-1"
                  />
                  <Button onClick={inviteAdmin} disabled={inviting}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    {inviting ? "…" : "Пригласить"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Роль будет назначена автоматически при регистрации пользователя с этим email.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
