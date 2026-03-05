import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Store } from "lucide-react";

export default function Showcase() {
  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Store className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Витрина</h1>
        </div>
        <p className="text-muted-foreground">Раздел в разработке. Скоро здесь появится контент.</p>
      </motion.div>
    </AppLayout>
  );
}
