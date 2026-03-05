import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Dumbbell, Apple, TrendingUp, Zap, Trophy, User, HelpCircle, 
  MessageCircle, X, Menu, Store, Swords 
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserContext";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Панель", tourId: "nav-dashboard" },
  { to: "/workouts", icon: Dumbbell, label: "Тренировки", tourId: "nav-workouts" },
  { to: "/nutrition", icon: Apple, label: "Питание", tourId: "nav-nutrition" },
  { to: "/progress", icon: TrendingUp, label: "Прогресс", tourId: "nav-progress" },
  { to: "/sos", icon: Zap, label: "SOS", tourId: "nav-sos" },
  { to: "/gamification", icon: Trophy, label: "Достижения", tourId: "nav-gamification" },
  { to: "/showcase", icon: Store, label: "Витрина", tourId: "nav-showcase" },
  { to: "/challenges", icon: Swords, label: "Челленджи", tourId: "nav-challenges" },
  { to: "/ask-ai", icon: MessageCircle, label: "AI-агент", tourId: "nav-ask-ai" },
  { to: "/faq", icon: HelpCircle, label: "FAQ", tourId: "nav-faq" },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile } = useUser();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card p-4 gap-1 fixed h-full z-30">
        <div className="px-3 py-4 mb-4">
          <h1 className="font-display text-xl font-bold text-foreground">Wellness<span className="text-primary">AI</span></h1>
          <p className="text-xs text-muted-foreground mt-1">Интеллектуальная система</p>
        </div>
        <nav className="flex-1 flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                data-tour={item.tourId}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border pt-2 mt-2">
          <Link
            to="/profile"
            data-tour="nav-profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              location.pathname === "/profile"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <User className="w-4 h-4" />
            Профиль
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-display text-lg font-bold text-foreground">Wellness<span className="text-primary">AI</span></h1>
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
              className="fixed right-0 top-0 bottom-0 w-72 bg-card z-50 p-4 shadow-elevated lg:hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-lg font-bold">Меню</h2>
                <button onClick={() => setMobileOpen(false)} className="p-2"><X className="w-5 h-5" /></button>
              </div>
              <nav className="flex flex-col gap-0.5">
                {navItems.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-border pt-2 mt-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === "/profile"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Профиль
                </Link>
              </div>
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

      {/* Ask AI FAB */}
      <Link
        to="/ask-ai"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full gradient-primary shadow-elevated flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform"
      >
        <MessageCircle className="w-6 h-6" />
      </Link>
    </div>
  );
};
