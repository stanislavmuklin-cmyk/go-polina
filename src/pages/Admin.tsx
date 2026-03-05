import { useState, useEffect, useCallback } from "react";
import { AdminLayout, AdminSection } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, Save, Building2, Home, UserPlus, Shield, Loader2, Sparkles, ImageIcon, Users, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateContent } from "@/lib/ai";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShowcaseTab } from "@/components/admin/ShowcaseTab";
import { ChallengesTab } from "@/components/admin/ChallengesTab";
import { Badge } from "@/components/ui/badge";

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
  image?: string;
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
  const [activeSection, setActiveSection] = useState<AdminSection>("workouts");
  const [location, setLocation] = useState<"gym" | "home">("gym");
  const [week, setWeek] = useState<DayPlan[]>(emptyWeek());
  const [saving, setSaving] = useState(false);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Co-admins
  const [admins, setAdmins] = useState<{ user_id: string; email: string }[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  // Telegram members
  const [members, setMembers] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [newTelegramId, setNewTelegramId] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [addingMember, setAddingMember] = useState(false);

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
        setAdmins(data.map((r: any) => ({ user_id: r.user_id, email: "" })));
      }
    };
    loadAdmins();
  }, []);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    const [{ data: tgData }, { data: profileData }] = await Promise.all([
      supabase.from("telegram_members").select("*").order("activated_at", { ascending: false }),
      supabase.from("profiles").select("user_id, name, level, xp, goal, created_at"),
    ]);
    if (tgData) setMembers(tgData);
    if (profileData) setAllProfiles(profileData);
    setMembersLoading(false);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const toggleMember = async (telegramId: number, activate: boolean) => {
    await supabase.from("telegram_members").update({
      is_active: activate,
      ...(activate ? { activated_at: new Date().toISOString(), deactivated_at: null } : { deactivated_at: new Date().toISOString() }),
    }).eq("telegram_id", telegramId);
    loadMembers();
    toast.success(activate ? "Участник активирован" : "Участник деактивирован");
  };

  const addMember = async () => {
    if (!newTelegramId.trim()) return;
    setAddingMember(true);
    try {
      const { error } = await supabase.from("telegram_members").upsert({
        telegram_id: parseInt(newTelegramId.trim()),
        telegram_username: newUsername.trim() || null,
        is_active: true,
        activated_at: new Date().toISOString(),
      }, { onConflict: "telegram_id" });
      if (error) throw error;
      toast.success("Участник добавлен");
      setNewTelegramId("");
      setNewUsername("");
      loadMembers();
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    } finally {
      setAddingMember(false);
    }
  };

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      const defaultProfile = {
        name: "",
        fitnessLevel: "intermediate" as const,
        goal: "general_fitness",
        workoutLocation: location,
      };
      const data = await generateContent("workouts", defaultProfile as any);
      if (data?.days) {
        const generated: DayPlan[] = DAYS.map((d, i) => {
          const aiDay = data.days[i];
          return {
            day: d.name,
            type: aiDay?.type || "",
            exercises: (aiDay?.exercises || []).map((ex: any) => ({
              name: ex.name,
              sets: ex.sets,
              image: "",
            })),
            sort_order: d.sort,
          };
        });
        setWeek(generated);
        toast.success("Программа сгенерирована! Отредактируйте и сохраните.");
      }
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации");
    } finally {
      setGenerating(false);
    }
  };

  const saveWorkouts = async () => {
    if (!user) return;
    setSaving(true);
    try {
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
        i === dayIdx ? { ...d, exercises: [...d.exercises, { name: "", sets: "", image: "" }] } : d
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

  const renderContent = () => {
    switch (activeSection) {
      case "workouts":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Тренировки</h2>
              <p className="text-sm text-muted-foreground mt-1">Управление программами тренировок</p>
            </div>
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
            <Button variant="outline" onClick={generateWithAI} disabled={generating || loadingWorkouts} className="w-full">
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Сгенерировать с ИИ
            </Button>
            {loadingWorkouts ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <>
                {week.map((day, dayIdx) => (
                  <Card key={day.day}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{day.day}</span>
                        <Input value={day.type} onChange={(e) => updateDay(dayIdx, "type", e.target.value)} placeholder="Тип (Силовая, Кардио, Отдых...)" className="max-w-[250px] h-8 text-sm" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {day.exercises.map((ex, exIdx) => (
                        <div key={exIdx} className="flex gap-2 items-center">
                          <Input value={ex.name} onChange={(e) => updateExercise(dayIdx, exIdx, "name", e.target.value)} placeholder="Упражнение" className="flex-1 h-8 text-sm" />
                          <Input value={ex.sets} onChange={(e) => updateExercise(dayIdx, exIdx, "sets", e.target.value)} placeholder="3×12" className="w-24 h-8 text-sm" />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className={`h-8 w-8 shrink-0 ${ex.image ? "text-primary" : "text-muted-foreground"}`}>
                                <ImageIcon className="w-3.5 h-3.5" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-3" side="top">
                              <p className="text-xs text-muted-foreground mb-2">URL изображения</p>
                              <Input value={ex.image || ""} onChange={(e) => updateExercise(dayIdx, exIdx, "image", e.target.value)} placeholder="https://example.com/image.jpg" className="h-8 text-sm" />
                              {ex.image && <img src={ex.image} alt={ex.name} className="mt-2 rounded-lg w-full h-32 object-cover" />}
                            </PopoverContent>
                          </Popover>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeExercise(dayIdx, exIdx)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => addExercise(dayIdx)}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Добавить упражнение
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                <Button onClick={saveWorkouts} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Сохранить тренировки
                </Button>
              </>
            )}
          </div>
        );

      case "members":
        // Build unified members list
        const profileMap = new Map(allProfiles.map((p: any) => [p.user_id, p]));
        const tgMap = new Map(members.map((m: any) => [m.user_id, m]));
        
        // Collect all unique user_ids
        const allUserIds = new Set([
          ...allProfiles.map((p: any) => p.user_id),
          ...members.filter((m: any) => m.user_id).map((m: any) => m.user_id),
        ]);

        const unifiedMembers = Array.from(allUserIds).map((uid) => {
          const profile = profileMap.get(uid);
          const tg = tgMap.get(uid);
          return {
            user_id: uid,
            name: profile?.name || tg?.telegram_first_name || "—",
            level: profile?.level || 1,
            xp: profile?.xp || 0,
            source: tg ? "telegram" : "email",
            telegram_username: tg?.telegram_username || null,
            telegram_id: tg?.telegram_id || null,
            is_active: tg?.is_active ?? true,
            created_at: profile?.created_at,
          };
        }).sort((a, b) => b.level - a.level || b.xp - a.xp);

        return (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Участники</h2>
              <p className="text-sm text-muted-foreground mt-1">Все пользователи клуба ({unifiedMembers.length})</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" /> Добавить участника Telegram
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={newTelegramId} onChange={e => setNewTelegramId(e.target.value)} placeholder="Telegram ID (число)" className="flex-1" />
                  <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="@username" className="flex-1" />
                  <Button onClick={addMember} disabled={addingMember}>
                    {addingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                {membersLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : unifiedMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет участников</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Имя</TableHead>
                          <TableHead>Источник</TableHead>
                          <TableHead>Уровень</TableHead>
                          <TableHead>XP</TableHead>
                          <TableHead>Контакт</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unifiedMembers.map((m) => (
                          <TableRow key={m.user_id}>
                            <TableCell className="text-sm font-medium">{m.name}</TableCell>
                            <TableCell>
                              <Badge variant={m.source === "telegram" ? "default" : "secondary"} className="text-xs">
                                {m.source === "telegram" ? "Telegram" : "Email"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{m.level}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{m.xp}</TableCell>
                            <TableCell className="text-sm">
                              {m.telegram_username ? (
                                <a
                                  href={`https://t.me/${m.telegram_username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  @{m.telegram_username}
                                </a>
                              ) : m.telegram_id ? (
                                <span className="font-mono text-xs text-muted-foreground">{m.telegram_id}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {m.source === "telegram" ? (
                                m.is_active ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-primary"><CheckCircle className="w-3.5 h-3.5" /> Активен</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-destructive"><XCircle className="w-3.5 h-3.5" /> Неактивен</span>
                                )
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {m.source === "telegram" && m.telegram_id && (
                                <Button variant="ghost" size="sm" onClick={() => toggleMember(m.telegram_id, !m.is_active)}>
                                  {m.is_active ? <XCircle className="w-3.5 h-3.5 text-destructive" /> : <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "admins":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Администраторы</h2>
              <p className="text-sm text-muted-foreground mt-1">Управление правами доступа</p>
            </div>
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
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com" type="email" className="flex-1" />
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
          </div>
        );

      case "showcase":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Витрина</h2>
              <p className="text-sm text-muted-foreground mt-1">Управление товарами витрины</p>
            </div>
            <ShowcaseTab />
          </div>
        );

      case "challenges":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Челленджи</h2>
              <p className="text-sm text-muted-foreground mt-1">Управление челленджами клуба</p>
            </div>
            <ChallengesTab />
          </div>
        );
    }
  };

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
    </AdminLayout>
  );
}
