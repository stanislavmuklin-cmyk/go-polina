import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Store, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface ShowcaseItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  button_text: string;
  button_url: string;
}

export default function Showcase() {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("showcase_items")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setItems(data as ShowcaseItem[]);
      setLoading(false);
    };
    load();

    // Realtime updates
    const channel = supabase
      .channel("showcase_items_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "showcase_items" }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Store className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Витрина</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            Товары скоро появятся. Следите за обновлениями!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card overflow-hidden flex flex-col"
              >
                {item.image_url && (
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-3 flex flex-col flex-1 gap-2">
                  {item.title && (
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2">{item.title}</h3>
                  )}
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3 flex-1">{item.description}</p>
                  )}
                  {item.button_url && (
                    <Button size="sm" className="w-full mt-auto text-xs" asChild>
                      <a href={item.button_url} target="_blank" rel="noopener noreferrer">
                        {item.button_text || "Подробнее"}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
