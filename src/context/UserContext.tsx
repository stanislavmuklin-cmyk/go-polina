import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

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
};

interface UserContextType {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  isOnboarded: boolean;
  setIsOnboarded: (v: boolean) => void;
  addXP: (amount: number) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

function storageKey(userId: string | undefined, key: string) {
  return userId ? `${key}_${userId}` : key;
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const uid = user?.id;

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(storageKey(uid, "wellness_profile"));
    return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
  });
  const [isOnboarded, setIsOnboarded] = useState(() => {
    return localStorage.getItem(storageKey(uid, "wellness_onboarded")) === "true";
  });

  // Reload profile when user changes (login/logout)
  useEffect(() => {
    const saved = localStorage.getItem(storageKey(uid, "wellness_profile"));
    setProfile(saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile);
    setIsOnboarded(localStorage.getItem(storageKey(uid, "wellness_onboarded")) === "true");
  }, [uid]);

  useEffect(() => {
    localStorage.setItem(storageKey(uid, "wellness_profile"), JSON.stringify(profile));
  }, [profile, uid]);

  useEffect(() => {
    localStorage.setItem(storageKey(uid, "wellness_onboarded"), String(isOnboarded));
  }, [isOnboarded, uid]);

  const updateProfile = (partial: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...partial }));
  };

  const addXP = (amount: number) => {
    setProfile((prev) => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      return { ...prev, xp: newXP, level: newLevel };
    });
  };

  return (
    <UserContext.Provider value={{ profile, setProfile, updateProfile, isOnboarded, setIsOnboarded, addXP }}>
      {children}
    </UserContext.Provider>
  );
};
