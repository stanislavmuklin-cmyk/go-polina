import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";

export default function Challenges() {
  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Swords className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Челленджи</h1>
        </div>
        <p className="text-muted-foreground">Раздел в разработке. Скоро здесь появится контент.</p>
      </motion.div>
    </AppLayout>
  );
}
