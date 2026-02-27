import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { isTelegramMiniApp, getTelegramInitData, initTelegramWebApp } from "@/lib/telegram";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isTelegram: boolean;
  telegramError: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTelegram] = useState(() => isTelegramMiniApp());
  const [telegramError, setTelegramError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!isTelegram) setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!isTelegram) setLoading(false);
    });

    // Telegram Mini App auto-auth
    if (isTelegram) {
      initTelegramWebApp();
      const initData = getTelegramInitData();
      if (initData) {
        authenticateViaTelegram(initData);
      } else {
        setLoading(false);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const authenticateViaTelegram = async (initData: string) => {
    try {
      const response = await supabase.functions.invoke("telegram-auth", {
        body: { initData },
      });

      if (response.error) {
        const errorData = response.error;
        setTelegramError(typeof errorData === "object" && "message" in errorData ? errorData.message : "Ошибка авторизации через Telegram");
        setLoading(false);
        return;
      }

      const data = response.data;

      if (data?.error) {
        setTelegramError(data.error);
        setLoading(false);
        return;
      }

      if (data?.access_token && data?.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        if (sessionError) {
          setTelegramError(sessionError.message);
        }
      }
    } catch (err: any) {
      setTelegramError(err.message || "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isTelegram, telegramError, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
