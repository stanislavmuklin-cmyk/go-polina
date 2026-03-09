import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useMembershipCheck() {
  const { user, loading: authLoading } = useAuth();
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setIsActive(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("telegram_members")
        .select("is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Membership check error:", error);
        // On error, allow access (don't lock out users due to DB issues)
        setIsActive(null);
        setLoading(false);
        return;
      }

      if (!data) {
        // No telegram_members record — user signed up via email directly, allow access
        setIsActive(null);
        setLoading(false);
        return;
      }

      setIsActive(data.is_active);
      setLoading(false);
    };

    check();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return { isActive, loading };
}
