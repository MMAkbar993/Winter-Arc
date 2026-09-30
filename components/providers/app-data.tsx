"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface ProjectOption {
  id: string;
  name: string;
}

export interface AppData {
  /** User's local date (yyyy-MM-dd) in their configured timezone. */
  today: string;
  timezone: string;
  currency: string;
  projects: ProjectOption[];
  targets: {
    dailyLearningMinutes: number;
    dailyOutreach: number;
    weeklyWorkouts: number;
  };
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ value, children }: { value: AppData; children: ReactNode }) {
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside <AppDataProvider>");
  return ctx;
}
