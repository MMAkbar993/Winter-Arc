import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AppDataProvider } from "@/components/providers/app-data";
import { CommandPaletteProvider } from "@/features/command-palette/command-palette";
import { QuickAddProvider } from "@/features/quick-add/quick-add-provider";
import { formatISODate } from "@/lib/dates";
import { requireOnboardedContext } from "@/lib/data/context";

/** Authenticated app shell. Every page below requires a signed-in, onboarded user. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await requireOnboardedContext();
  const { supabase, user, settings, challenge, progress, today, displayName } = ctx;

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("user_id", user.id)
    .in("status", ["active", "waiting"])
    .order("updated_at", { ascending: false })
    .limit(50);

  const challengeLabel =
    progress.status === "upcoming"
      ? `${challenge.name} starts ${formatISODate(challenge.startDate, "MMMM d")}`
      : progress.status === "completed"
        ? `${challenge.name} · complete`
        : `${challenge.name} · Day ${progress.dayNumber} of ${progress.totalDays}`;

  return (
    <AppDataProvider
      value={{
        today,
        timezone: settings.timezone,
        currency: settings.currency,
        projects: projects ?? [],
        targets: {
          dailyLearningMinutes: settings.dailyLearningTargetMinutes,
          dailyOutreach: settings.dailyOutreachTarget,
          weeklyWorkouts: settings.weeklyWorkoutTarget,
        },
      }}
    >
      <QuickAddProvider>
        <CommandPaletteProvider>
          <a
            href="#main"
            className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
          >
            Skip to content
          </a>
          <div className="flex min-h-dvh">
            <AppSidebar name={displayName} email={user.email ?? ""} />
            <div className="flex min-w-0 flex-1 flex-col">
              <AppHeader challengeLabel={challengeLabel} />
              <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pb-12">
                {children}
              </main>
            </div>
          </div>
          <MobileNav name={displayName} />
        </CommandPaletteProvider>
      </QuickAddProvider>
    </AppDataProvider>
  );
}
