import { describe, expect, it } from "vitest";
import {
  habitBreakdown,
  habitExtremes,
  percentChange,
  weekdayExtremes,
  weekdayPerformance,
  weeklyCompletion,
} from "@/lib/analytics";
import { emptyDay, lastNDays, normalizeSeries, totalsForRange } from "@/lib/series";

const day = (d: string, overrides: Partial<ReturnType<typeof emptyDay>> = {}) => ({ ...emptyDay(d), ...overrides });

describe("series totals", () => {
  const series = [
    day("2026-10-01", { score: 7, workouts: 1, learningMinutes: 120, income: 0.1 }),
    day("2026-10-02", { score: 5, outreachActions: 15, income: 0.2 }),
    day("2026-10-03", { score: 2, postsPublished: 1 }),
    day("2026-10-04", { score: 0 }),
  ];

  it("sums metrics within the inclusive range", () => {
    const t = totalsForRange(series, "2026-10-01", "2026-10-03", 5);
    expect(t).toMatchObject({
      days: 3,
      workouts: 1,
      learningMinutes: 120,
      outreachActions: 15,
      postsPublished: 1,
      income: 0.3,
      scoreSum: 14,
      averageScore: 4.7,
      completionRate: 67,
      successfulDays: 2,
      perfectDays: 1,
    });
  });

  it("handles empty ranges", () => {
    expect(totalsForRange(series, "2027-01-01", "2027-01-07", 5)).toMatchObject({ days: 0, averageScore: 0, completionRate: 0 });
  });

  it("normalises numeric strings from Postgres", () => {
    const [row] = normalizeSeries([
      {
        day: "2026-10-01", score: 3, workouts: 1, workout_minutes: 40, learning_minutes: 60, prospects_contacted: 2,
        outreach_logged: 3, followups_done: 1, outreach_actions: 6, replies: 1, clients_won: 0, won_value: "0",
        work_minutes: 0, work_earned: "1500.50", posts_published: 0, income: "25000.00", expenses: "0", savings: "-500",
      },
    ]);
    expect(row).toMatchObject({ income: 25000, workEarned: 1500.5, savings: -500, outreachActions: 6 });
  });

  it("fills gaps for trailing windows", () => {
    const window = lastNDays(series, "2026-10-06", 7);
    expect(window.map((d) => d.day)).toEqual([
      "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06",
    ]);
    expect(window[1]?.score).toBe(7);
    expect(window[6]?.score).toBe(0);
  });
});

describe("habit analytics", () => {
  it("finds strongest and weakest habits", () => {
    const stats = habitBreakdown(
      [
        { habit_key: "workout", completed: true },
        { habit_key: "workout", completed: true },
        { habit_key: "learning", completed: true },
        { habit_key: "sleep", completed: false },
      ],
      2,
    );
    expect(stats.find((s) => s.key === "workout")).toMatchObject({ completed: 2, rate: 100 });
    const { strongest, weakest } = habitExtremes(stats);
    expect(strongest?.key).toBe("workout");
    expect(weakest?.completed).toBe(0);
  });

  it("returns nulls when nothing is tracked", () => {
    expect(habitExtremes(habitBreakdown([], 0))).toEqual({ strongest: null, weakest: null });
  });
});

describe("weekday analytics", () => {
  it("averages by weekday and finds best/worst", () => {
    const series = [
      day("2026-10-05", { score: 7 }), // Monday
      day("2026-10-12", { score: 5 }), // Monday
      day("2026-10-10", { score: 1 }), // Saturday
    ];
    const stats = weekdayPerformance(series);
    expect(stats[0]).toMatchObject({ label: "Monday", averageScore: 6, days: 2 });
    const { best, worst } = weekdayExtremes(stats);
    expect(best?.label).toBe("Monday");
    expect(worst?.label).toBe("Saturday");
  });

  it("groups weekly completion by Monday", () => {
    const weeks = weeklyCompletion([day("2026-10-05", { score: 7 }), day("2026-10-11", { score: 0 }), day("2026-10-12", { score: 7 })]);
    expect(weeks).toEqual([
      { weekStart: "2026-10-05", completionRate: 50, averageScore: 3.5 },
      { weekStart: "2026-10-12", completionRate: 100, averageScore: 7 },
    ]);
  });
});

describe("percentChange", () => {
  it("computes change and handles zero baselines", () => {
    expect(percentChange(65, 100)).toBe(-35);
    expect(percentChange(5, 0)).toBeNull();
  });
});

describe("sumByWeek", () => {
  it("buckets values by Monday-based week", async () => {
    const { sumByWeek } = await import("@/lib/analytics");
    const series = [day("2026-10-04", { workouts: 1 }), day("2026-10-05", { workouts: 1 }), day("2026-10-07", { workouts: 2 })];
    expect(sumByWeek(series, (d) => d.workouts)).toEqual([
      { weekStart: "2026-09-28", value: 1 },
      { weekStart: "2026-10-05", value: 3 },
    ]);
  });
});
