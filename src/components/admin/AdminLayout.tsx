import { Link } from "react-router-dom";
import { Dumbbell, Users, Shield, Store, ArrowLeft, X, Menu, Settings, Swords } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";

export type AdminSection = "workouts" | "members" | "admins" | "showcase" | "challenges";

const navItems: { id: AdminSection; icon: typeof Dumbbell; label: string }[] = [
  { id: "workouts", icon: Dumbbell, label: "Тренировки" },
  { id: "members", icon: Users, label: "Участники" },
  { id: "challenges", icon: Swords, label: "Челленджи" },
  { id: "admins", icon: Shield, label: "Админы" },
  { id: "showcase", icon: Store, label: "Витрина" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

export const AdminLayout = ({ children, activeSection, onSectionChange }: AdminLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <nav className="flex-1 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                onNavigate?.();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <Separator />
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад в приложение
      </Link>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card p-4 gap-3 fixed h-full z-30">
        <div className="px-3 py-4 mb-2">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl font-bold text-foreground">Админ-панель</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Управление контентом</p>
        </div>
        <NavContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          <h1 className="font-display text-lg font-bold text-foreground">Админ-панель</h1>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-foreground">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 z-50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-card z-50 p-4 shadow-elevated lg:hidden flex flex-col gap-3"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg font-bold">Админ-панель</h2>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2"><X className="w-5 h-5" /></button>
              </div>
              <NavContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
