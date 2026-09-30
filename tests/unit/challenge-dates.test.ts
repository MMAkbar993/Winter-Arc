import { describe, expect, it } from "vitest";
import { challengeTotalDays, getChallengeProgress } from "@/lib/challenge";
import {
  addDaysISO,
  diffDaysISO,
  eachDayISO,
  greetingForHour,
  isISODate,
  startOfWeekISO,
  todayInTimeZone,
} from "@/lib/dates";

describe("challenge progress", () => {
  const start = "2026-10-01";
  const end = "2026-12-31";

  it("Winter Arc 2026 is 92 days", () => {
    expect(challengeTotalDays(start, end)).toBe(92);
  });

  it("reports day 1 on the start date", () => {
    expect(getChallengeProgress(start, end, "2026-10-01")).toMatchObject({
      status: "active",
      dayNumber: 1,
      daysRemaining: 91,
      percentComplete: 1.1,
    });
  });

  it("Day 17 of 92 is 18.5% complete", () => {
    expect(getChallengeProgress(start, end, "2026-10-17")).toMatchObject({ dayNumber: 17, percentComplete: 18.5 });
  });

  it("is upcoming before the start date", () => {
    expect(getChallengeProgress(start, end, "2026-09-30")).toMatchObject({
      status: "upcoming",
      dayNumber: 0,
      daysUntilStart: 1,
      percentComplete: 0,
    });
  });

  it("reports the final day and completion", () => {
    expect(getChallengeProgress(start, end, "2026-12-31")).toMatchObject({
      status: "active",
      dayNumber: 92,
      daysRemaining: 0,
      percentComplete: 100,
    });
    expect(getChallengeProgress(start, end, "2027-01-01")).toMatchObject({ status: "completed", dayNumber: 92 });
  });
});

describe("timezone-aware dates", () => {
  it("uses the user's local day, not UTC", () => {
    // 20:30 UTC on Sep 30 is already 01:30 on Oct 1 in Karachi (UTC+5).
    const instant = new Date("2026-09-30T20:30:00Z");
    expect(todayInTimeZone("Asia/Karachi", instant)).toBe("2026-10-01");
    expect(todayInTimeZone("UTC", instant)).toBe("2026-09-30");
    expect(todayInTimeZone("America/New_York", instant)).toBe("2026-09-30");
  });

  it("does day arithmetic across month boundaries and DST", () => {
    expect(addDaysISO("2026-10-31", 1)).toBe("2026-11-01");
    expect(diffDaysISO("2026-11-02", "2026-10-31")).toBe(2);
    expect(eachDayISO("2026-10-30", "2026-11-02")).toHaveLength(4);
    expect(eachDayISO("2026-11-02", "2026-10-30")).toEqual([]);
  });

  it("weeks start on Monday", () => {
    expect(startOfWeekISO("2026-10-04")).toBe("2026-09-28"); // Sunday → previous Monday
    expect(startOfWeekISO("2026-10-05")).toBe("2026-10-05");
  });

  it("validates ISO dates strictly", () => {
    expect(isISODate("2026-10-01")).toBe(true);
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("10/01/2026")).toBe(false);
  });

  it("greets by time of day", () => {
    expect(greetingForHour(8)).toBe("Good morning");
    expect(greetingForHour(14)).toBe("Good afternoon");
    expect(greetingForHour(21)).toBe("Good evening");
  });
});
