import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

// Module-level cache to avoid repeated RPC calls per session
let cachedUserId: string | null = null;
let cachedResult: boolean = false;

export function clearAdminCache() {
  cachedUserId = null;
  cachedResult = false;
}

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      clearAdminCache();
      return;
    }

    // Use cache if same user
    if (cachedUserId === user.id) {
      setIsAdmin(cachedResult);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      const result = !error && !!data;
      cachedUserId = user.id;
      cachedResult = result;
      setIsAdmin(result);
      setLoading(false);
    };

    check();
  }, [user]);

  return { isAdmin, loading };
}
