import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface UserProfile {
  name: string;
  gender: "male" | "female" | "other";
  age: number;
  height: number;
  weight: number;
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  goal: "fat-loss" | "muscle" | "energy" | "skin" | "anti-stress";
  dietPreferences: string[];
  dietType: "no-restriction" | "keto" | "paleo" | "mediterranean" | "low-carb";
  workoutLocation: "gym" | "home";
  equipment: string[];
  trackCycle: boolean;
  complaints: string;
  xp: number;
  level: number;
  streak: number;
  completedWorkouts: string[];
  waterGlasses: number;
  completedMeals: string[];
  completedSupplements: string[];
  lastWeeklyReportDate: string | null;
  dailyReports: { date: string; workoutDone: boolean; energy: number; nutrition: number; sleep: number; steps: number }[];
  aiChatCount: number;
  aiChatResetDate: string | null;
  mealRegenCount: number;
  mealRegenResetDate: string | null;
}

const defaultProfile: UserProfile = {
  name: "",
  gender: "female",
  age: 30,
  height: 165,
  weight: 65,
  fitnessLevel: "beginner",
  goal: "fat-loss",
  dietPreferences: [],
  dietType: "no-restriction",
  workoutLocation: "gym",
  equipment: [],
  trackCycle: false,
  complaints: "",
  xp: 0,
  level: 1,
  streak: 0,
  completedWorkouts: [],
  waterGlasses: 0,
  completedMeals: [],
  completedSupplements: [],
  lastWeeklyReportDate: null,
  dailyReports: [],
  aiChatCount: 0,
  aiChatResetDate: null,
  mealRegenCount: 0,
  mealRegenResetDate: null,
};

interface UserContextType {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  isOnboarded: boolean;
  setIsOnboarded: (v: boolean) => void;
  addXP: (amount: number) => void;
  profileLoading: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

// Map camelCase profile fields to snake_case DB columns
function toDbRow(p: Partial<UserProfile>): Record<string, any> {
  const map: Record<string, string> = {
    fitnessLevel: "fitness_level",
    dietPreferences: "diet_preferences",
    dietType: "diet_type",
    workoutLocation: "workout_location",
    trackCycle: "track_cycle",
    completedWorkouts: "completed_workouts",
    waterGlasses: "water_glasses",
    completedMeals: "completed_meals",
    completedSupplements: "completed_supplements",
    lastWeeklyReportDate: "last_weekly_report_date",
    dailyReports: "daily_reports",
    aiChatCount: "ai_chat_count",
    aiChatResetDate: "ai_chat_reset_date",
    mealRegenCount: "meal_regen_count",
    mealRegenResetDate: "meal_regen_reset_date",
  };
  const row: Record<string, any> = {};
  for (const [key, val] of Object.entries(p)) {
    row[map[key] || key] = val;
  }
  return row;
}

// Map snake_case DB row to camelCase profile
function fromDbRow(row: any): UserProfile {
  return {
    name: row.name ?? "",
    gender: row.gender ?? "female",
    age: row.age ?? 30,
    height: row.height ?? 165,
    weight: row.weight ?? 65,
    fitnessLevel: row.fitness_level ?? "beginner",
    goal: row.goal ?? "fat-loss",
    dietPreferences: row.diet_preferences ?? [],
    dietType: row.diet_type ?? "no-restriction",
    workoutLocation: row.workout_location ?? "gym",
    equipment: row.equipment ?? [],
    trackCycle: row.track_cycle ?? false,
    complaints: row.complaints ?? "",
    xp: row.xp ?? 0,
    level: row.level ?? 1,
    streak: row.streak ?? 0,
    completedWorkouts: row.completed_workouts ?? [],
    waterGlasses: row.water_glasses ?? 0,
    completedMeals: row.completed_meals ?? [],
    completedSupplements: row.completed_supplements ?? [],
    lastWeeklyReportDate: row.last_weekly_report_date ?? null,
    dailyReports: row.daily_reports ?? [],
    aiChatCount: row.ai_chat_count ?? 0,
    aiChatResetDate: row.ai_chat_reset_date ?? null,
    mealRegenCount: row.meal_regen_count ?? 0,
    mealRegenResetDate: row.meal_regen_reset_date ?? null,
  };
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.id;

  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isOnboarded, setIsOnboardedState] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Load profile from DB
  useEffect(() => {
    // While auth is still restoring session, keep profileLoading=true
    if (authLoading) {
      setProfileLoading(true);
      return;
    }

    if (!uid) {
      setProfile(defaultProfile);
      setIsOnboardedState(false);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Failed to load profile:", error);
        setProfileLoading(false);
        return;
      }

      if (!data) {
        // Profile doesn't exist yet (signup trigger may not have fired yet)
        // Insert one
        const { data: inserted, error: insertErr } = await supabase
          .from("profiles")
          .insert({ user_id: uid })
          .select()
          .single();

        if (cancelled) return;
        if (insertErr) {
          console.error("Failed to create profile:", insertErr);
          setProfileLoading(false);
          return;
        }
        const p = fromDbRow(inserted);
        setProfile(p);
        setIsOnboardedState(inserted.is_onboarded ?? false);
        setProfileLoading(false);
        return;
      }

      let p = fromDbRow(data);
      const onboarded = data.is_onboarded ?? false;

      // Daily reset check
      const today = format(new Date(), "yyyy-MM-dd");
      if (data.last_daily_reset !== today && onboarded) {
        const resetFields: Record<string, any> = {
          water_glasses: 0,
          completed_workouts: [],
          completed_meals: [],
          completed_supplements: [],
          ai_chat_count: 0,
          meal_regen_count: 0,
          last_daily_reset: today,
        };
        await supabase.from("profiles").update(resetFields).eq("user_id", uid);
        p = { ...p, waterGlasses: 0, completedWorkouts: [], completedMeals: [], completedSupplements: [], aiChatCount: 0, mealRegenCount: 0 };
      }

      setProfile(p);
      setIsOnboardedState(onboarded);
      setProfileLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [uid]);

  const updateProfile = useCallback((partial: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...partial };
      // Write to DB async
      if (uid) {
        const dbFields = toDbRow(partial);
        dbFields.updated_at = new Date().toISOString();
        supabase.from("profiles").update(dbFields).eq("user_id", uid).then(({ error }) => {
          if (error) console.error("Profile update error:", error);
        });
      }
      return next;
    });
  }, [uid]);

  const setIsOnboarded = useCallback((v: boolean) => {
    setIsOnboardedState(v);
    if (uid) {
      supabase.from("profiles").update({ is_onboarded: v, updated_at: new Date().toISOString() }).eq("user_id", uid).then(({ error }) => {
        if (error) console.error("Onboarding update error:", error);
      });
    }
  }, [uid]);

  const addXP = useCallback((amount: number) => {
    setProfile((prev) => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      if (uid) {
        supabase.from("profiles").update({ xp: newXP, level: newLevel, updated_at: new Date().toISOString() }).eq("user_id", uid).then(({ error }) => {
          if (error) console.error("XP update error:", error);
        });
      }
      return { ...prev, xp: newXP, level: newLevel };
    });
  }, [uid]);

  return (
    <UserContext.Provider value={{ profile, setProfile, updateProfile, isOnboarded, setIsOnboarded, addXP, profileLoading }}>
      {children}
    </UserContext.Provider>
  );
};
