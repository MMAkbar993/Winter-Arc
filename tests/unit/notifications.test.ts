import { describe, expect, it } from "vitest";
import { buildNotifications, type NotificationInput } from "@/features/notifications/generate";

const base: NotificationInput = {
  today: "2026-10-07", // Wednesday
  hour: 10,
  weekStart: "2026-10-05",
  monthKey: "2026-10",
  followupsDueToday: 0,
  overdueFollowups: 0,
  learningMinutesToday: 0,
  learningTargetMinutes: 120,
  weeklyReviewDone: false,
  currentStreak: 0,
  challengeId: "c1",
  savingsThisMonth: 0,
  monthlySavingsGoal: 0,
  currency: "PKR",
};

const keys = (input: Partial<NotificationInput>) => buildNotifications({ ...base, ...input }).map((n) => n.dedupe_key);

describe("buildNotifications", () => {
  it("is quiet when nothing needs attention", () => {
    expect(keys({})).toEqual([]);
  });

  it("reports follow-ups due and overdue", () => {
    const list = buildNotifications({ ...base, followupsDueToday: 3, overdueFollowups: 1 });
    expect(list.map((n) => n.title)).toEqual(["3 follow-ups due today", "1 overdue follow-up"]);
  });

  it("nudges about learning only in the evening", () => {
    expect(keys({ hour: 17 })).not.toContain("learning:2026-10-07");
    expect(keys({ hour: 19 })).toContain("learning:2026-10-07");
    expect(keys({ hour: 19, learningMinutesToday: 120 })).not.toContain("learning:2026-10-07");
  });

  it("asks for the weekly review on Sunday until it is done", () => {
    expect(keys({ today: "2026-10-11" })).toContain("review:2026-10-05");
    expect(keys({ today: "2026-10-11", weeklyReviewDone: true })).not.toContain("review:2026-10-05");
  });

  it("celebrates streak milestones exactly once per milestone", () => {
    expect(keys({ currentStreak: 7 })).toContain("streak:c1:7");
    expect(keys({ currentStreak: 8 })).toEqual([]);
  });

  it("flags a reached savings goal", () => {
    expect(keys({ monthlySavingsGoal: 40000, savingsThisMonth: 41000 })).toContain("savings:2026-10");
    expect(keys({ monthlySavingsGoal: 0, savingsThisMonth: 41000 })).toEqual([]);
  });
});
