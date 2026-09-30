import "server-only";
import { getOverview, type Overview } from "@/features/dashboard/overview";
import type { UserContext } from "@/lib/data/context";
import { toNumber } from "@/lib/finance";
import type { ProjectRow, WorkSessionRow } from "@/types/database";

export type WorkSessionWithProject = WorkSessionRow & { projects: { name: string } | null };

export interface ProjectSummary extends ProjectRow {
  minutes: number;
  earned: number;
  sessions: number;
}

export interface ProjectsData {
  overview: Overview;
  projects: ProjectSummary[];
  sessions: WorkSessionWithProject[];
  totalEarned: number;
  mostActive: { name: string; minutes: number } | null;
}

export async function getProjectsData(ctx: UserContext): Promise<ProjectsData> {
  const { supabase, user } = ctx;
  const [overview, projectsRes, sessionsRes, totalsRes] = await Promise.all([
    getOverview(ctx),
    supabase.from("projects").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase
      .from("work_sessions")
      .select("*, projects(name)")
      .eq("user_id", user.id)
      .order("session_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("work_sessions").select("project_id, duration_minutes, amount_earned, session_date").eq("user_id", user.id).limit(5000),
  ]);
  if (projectsRes.error || sessionsRes.error || totalsRes.error) {
    console.error("[db] projects", projectsRes.error ?? sessionsRes.error ?? totalsRes.error);
    throw new Error("Could not load projects.");
  }

  const perProject = new Map<string, { minutes: number; earned: number; sessions: number; monthMinutes: number }>();
  let totalEarned = 0;
  for (const s of totalsRes.data) {
    const agg = perProject.get(s.project_id) ?? { minutes: 0, earned: 0, sessions: 0, monthMinutes: 0 };
    agg.minutes += s.duration_minutes;
    agg.earned += toNumber(s.amount_earned);
    agg.sessions += 1;
    if (s.session_date >= overview.monthStart) agg.monthMinutes += s.duration_minutes;
    perProject.set(s.project_id, agg);
    totalEarned += toNumber(s.amount_earned);
  }

  const projects = projectsRes.data.map((p) => {
    const agg = perProject.get(p.id);
    return { ...p, minutes: agg?.minutes ?? 0, earned: agg?.earned ?? 0, sessions: agg?.sessions ?? 0 };
  });

  let mostActive: ProjectsData["mostActive"] = null;
  for (const p of projectsRes.data) {
    const monthMinutes = perProject.get(p.id)?.monthMinutes ?? 0;
    if (monthMinutes > 0 && (!mostActive || monthMinutes > mostActive.minutes)) mostActive = { name: p.name, minutes: monthMinutes };
  }

  return { overview, projects, sessions: sessionsRes.data, totalEarned: Math.round(totalEarned * 100) / 100, mostActive };
}
