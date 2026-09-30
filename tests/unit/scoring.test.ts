import { describe, expect, it } from "vitest";
import { HABIT_KEYS, type HabitKey } from "@/lib/constants";
import {
  calculateActivityStreak,
  calculateDailyScore,
  calculateStreaks,
  intensityForScore,
  scorePercent,
} from "@/lib/scoring";

const habits = (done: number) =>
  HABIT_KEYS.map((habit_key, i) => ({ habit_key, completed: i < done }));

describe("calculateDailyScore", () => {
  it("counts one point per completed habit", () => {
    expect(calculateDailyScore(habits(0))).toBe(0);
    expect(calculateDailyScore(habits(5))).toBe(5);
    expect(calculateDailyScore(habits(7))).toBe(7);
  });

  it("ignores duplicates and unknown keys, and never exceeds 7", () => {
    const rows = [
      ...habits(7),
      { habit_key: "workout" as HabitKey, completed: true },
      { habit_key: "gaming" as HabitKey, completed: true },
    ];
    expect(calculateDailyScore(rows)).toBe(7);
  });
});

describe("scorePercent", () => {
  it.each([
    [7, 100],
    [6, 86],
    [5, 71],
    [4, 57],
    [0, 0],
  ])("%i/7 → %i%%", (score, pct) => {
    expect(scorePercent(score)).toBe(pct);
  });

  it("clamps out-of-range values", () => {
    expect(scorePercent(9)).toBe(100);
    expect(scorePercent(-2)).toBe(0);
  });
});

describe("intensityForScore", () => {
  it("maps scores to heatmap buckets", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(intensityForScore)).toEqual([0, 1, 1, 2, 2, 3, 3, 4]);
  });
});

describe("calculateStreaks", () => {
  const base = { challengeStart: "2026-10-01", challengeEnd: "2026-12-31", threshold: 5 };
  const scores = (entries: Record<string, number>) => new Map(Object.entries(entries));

  it("returns zeros before the challenge starts", () => {
    expect(calculateStreaks({ ...base, today: "2026-09-30", scores: scores({ "2026-09-30": 7 }) })).toEqual({
      current: 0,
      longest: 0,
      successfulDays: 0,
      perfectDays: 0,
    });
  });

  it("counts consecutive successful days through today", () => {
    const s = scores({ "2026-10-01": 5, "2026-10-02": 6, "2026-10-03": 7 });
    expect(calculateStreaks({ ...base, today: "2026-10-03", scores: s })).toMatchObject({
      current: 3,
      longest: 3,
      successfulDays: 3,
      perfectDays: 1,
    });
  });

  it("does not break the streak while today is still in progress", () => {
    const s = scores({ "2026-10-01": 5, "2026-10-02": 6, "2026-10-03": 2 });
    expect(calculateStreaks({ ...base, today: "2026-10-03", scores: s }).current).toBe(2);
  });

  it("breaks on a failed past day and tracks the longest run", () => {
    const s = scores({
      "2026-10-01": 7, "2026-10-02": 7, "2026-10-03": 7, // run of 3
      "2026-10-04": 4, // fail
      "2026-10-05": 5, "2026-10-06": 5, // current run of 2
    });
    expect(calculateStreaks({ ...base, today: "2026-10-06", scores: s })).toMatchObject({ current: 2, longest: 3 });
  });

  it("treats missing days as failures", () => {
    const s = scores({ "2026-10-01": 7, "2026-10-03": 7 });
    expect(calculateStreaks({ ...base, today: "2026-10-03", scores: s })).toMatchObject({ current: 1, longest: 1 });
  });

  it("respects a custom threshold", () => {
    const s = scores({ "2026-10-01": 4, "2026-10-02": 4 });
    expect(calculateStreaks({ ...base, threshold: 4, today: "2026-10-02", scores: s }).current).toBe(2);
    expect(calculateStreaks({ ...base, threshold: 5, today: "2026-10-02", scores: s }).current).toBe(0);
  });

  it("never counts future days or days after the challenge ends", () => {
    const s = scores({ "2026-10-01": 7, "2026-10-02": 7, "2026-10-10": 7 });
    expect(calculateStreaks({ ...base, today: "2026-10-02", scores: s })).toMatchObject({
      current: 2,
      successfulDays: 2,
    });
    const end = scores({ "2026-12-30": 7, "2026-12-31": 7, "2027-01-01": 7 });
    expect(calculateStreaks({ ...base, today: "2027-01-05", scores: end })).toMatchObject({
      current: 2,
      successfulDays: 2,
    });
  });
});

describe("calculateActivityStreak", () => {
  it("counts back from today, allowing today to be empty", () => {
    const days = new Set(["2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(calculateActivityStreak(days, "2026-10-03")).toEqual({ current: 3, longest: 3 });
    expect(calculateActivityStreak(days, "2026-10-04")).toEqual({ current: 3, longest: 3 });
    expect(calculateActivityStreak(days, "2026-10-05")).toEqual({ current: 0, longest: 3 });
  });
});
