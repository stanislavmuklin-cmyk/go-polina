import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const { signUp, user, loading, isTelegram, telegramError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  // In Telegram mode, redirect or show error
  if (isTelegram) {
    if (telegramError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center space-y-4">
            <h1 className="font-display text-2xl font-bold text-foreground">Доступ закрыт</h1>
            <p className="text-muted-foreground text-sm">{telegramError}</p>
          </motion.div>
        </div>
      );
    }
    if (user) return <Navigate to="/dashboard" replace />;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Пароль должен быть не менее 6 символов"); return; }
    setSubmitting(true);
    try {
      await signUp(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Регистрация</h1>
          <p className="text-muted-foreground text-sm mt-1">Создайте аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Почта</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="email@example.com"
                className="w-full rounded-xl border border-border bg-card pl-10 pr-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Минимум 6 символов"
                className="w-full rounded-xl border border-border bg-card pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Зарегистрироваться
          </button>
        </form>

        <p className="text-sm text-muted-foreground text-center">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="text-primary hover:underline">Войти</Link>
        </p>
      </motion.div>
    </div>
  );
}
