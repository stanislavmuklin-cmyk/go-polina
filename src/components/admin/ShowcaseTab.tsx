import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, Loader2, ImageIcon, GripVertical, Eye, EyeOff } from "lucide-react";

interface ShowcaseItem {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  button_text: string;
  button_url: string;
  sort_order: number;
  is_active: boolean;
}

export function ShowcaseTab() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("showcase_items")
      .select("*")
      .order("sort_order");
    if (data) setItems(data as ShowcaseItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        image_url: "",
        button_text: "Подробнее",
        button_url: "",
        sort_order: prev.length,
        is_active: true,
      },
    ]);
  };

  const removeItem = async (idx: number) => {
    const item = items[idx];
    if (item.id) {
      await supabase.from("showcase_items").delete().eq("id", item.id);
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
    toast.success("Карточка удалена");
  };

  const updateItem = (idx: number, field: keyof ShowcaseItem, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const uploadImage = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("showcase").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("showcase").getPublicUrl(path);
      updateItem(idx, "image_url", urlData.publicUrl);
      toast.success("Изображение загружено");
    } catch (e: any) {
      toast.error(e.message || "Ошибка загрузки");
    } finally {
      setUploadingIdx(null);
    }
  };

  const saveAll = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Delete all, re-insert with correct order
      await supabase.from("showcase_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const rows = items.map((item, i) => ({
        title: item.title,
        description: item.description,
        image_url: item.image_url,
        button_text: item.button_text,
        button_url: item.button_url,
        sort_order: i,
        is_active: item.is_active,
        updated_by: user.id,
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from("showcase_items").insert(rows);
        if (error) throw error;
      }
      toast.success("Витрина сохранена!");
      loadItems();
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
      {items.map((item, idx) => (
        <Card key={idx}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <span>Карточка #{idx + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateItem(idx, "is_active", !item.is_active)}
                  title={item.is_active ? "Скрыть" : "Показать"}
                >
                  {item.is_active ? (
                    <Eye className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeItem(idx)}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Image */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Изображение</label>
              <div className="flex gap-2 items-center">
                <Input
                  value={item.image_url}
                  onChange={(e) => updateItem(idx, "image_url", e.target.value)}
                  placeholder="URL или загрузите файл"
                  className="flex-1 h-8 text-sm"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(idx, file);
                    }}
                  />
                  <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <span>
                      {uploadingIdx === idx ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </Button>
                </label>
              </div>
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="mt-2 rounded-lg w-full h-32 object-cover"
                />
              )}
            </div>

            {/* Title */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Название</label>
              <Input
                value={item.title}
                onChange={(e) => updateItem(idx, "title", e.target.value)}
                placeholder="Название товара"
                className="h-8 text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Описание</label>
              <Textarea
                value={item.description}
                onChange={(e) => updateItem(idx, "description", e.target.value)}
                placeholder="Краткое описание товара"
                className="text-sm min-h-[60px]"
              />
            </div>

            {/* Button */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Текст кнопки</label>
                <Input
                  value={item.button_text}
                  onChange={(e) => updateItem(idx, "button_text", e.target.value)}
                  placeholder="Купить"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Ссылка кнопки</label>
                <Input
                  value={item.button_url}
                  onChange={(e) => updateItem(idx, "button_url", e.target.value)}
                  placeholder="https://..."
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full" onClick={addItem}>
        <Plus className="w-4 h-4 mr-1" /> Добавить карточку
      </Button>

      <Button onClick={saveAll} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Сохранить витрину
      </Button>
    </div>
  );
}
