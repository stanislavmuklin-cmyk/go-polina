import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail } from "lucide-react";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
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
          <h1 className="font-display text-2xl font-bold text-foreground">Сброс пароля</h1>
          <p className="text-muted-foreground text-sm mt-1">Введите почту для восстановления</p>
        </div>

        {sent ? (
          <div className="bg-card rounded-xl border border-border p-5 text-center space-y-3">
            <p className="text-sm text-foreground">📧 Письмо отправлено на <strong>{email}</strong></p>
            <p className="text-xs text-muted-foreground">Проверьте почту и перейдите по ссылке</p>
            <Link to="/login" className="text-sm text-primary hover:underline block mt-3">Вернуться ко входу</Link>
          </div>
        ) : (
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

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Отправить ссылку
            </button>

            <Link to="/login" className="text-sm text-muted-foreground hover:underline block text-center">
              Назад ко входу
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
}
