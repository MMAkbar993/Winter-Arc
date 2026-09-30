import { diffDaysISO, type ISODate } from "@/lib/dates";

export type ChallengeStatus = "upcoming" | "active" | "completed";

export interface ChallengeProgress {
  status: ChallengeStatus;
  totalDays: number;
  /** 1-based day number; 0 before the start, totalDays after the end. */
  dayNumber: number;
  daysElapsed: number;
  daysRemaining: number;
  daysUntilStart: number;
  /** Day number as a share of the challenge, one decimal (Day 17 of 92 → 18.5). */
  percentComplete: number;
}

export function challengeTotalDays(start: ISODate, end: ISODate): number {
  return Math.max(diffDaysISO(end, start) + 1, 0);
}

export function getChallengeProgress(start: ISODate, end: ISODate, today: ISODate): ChallengeProgress {
  const totalDays = challengeTotalDays(start, end);

  if (today < start) {
    return {
      status: "upcoming",
      totalDays,
      dayNumber: 0,
      daysElapsed: 0,
      daysRemaining: totalDays,
      daysUntilStart: diffDaysISO(start, today),
      percentComplete: 0,
    };
  }

  if (today > end) {
    return {
      status: "completed",
      totalDays,
      dayNumber: totalDays,
      daysElapsed: totalDays,
      daysRemaining: 0,
      daysUntilStart: 0,
      percentComplete: 100,
    };
  }

  const dayNumber = diffDaysISO(today, start) + 1;
  return {
    status: "active",
    totalDays,
    dayNumber,
    daysElapsed: dayNumber,
    daysRemaining: totalDays - dayNumber,
    daysUntilStart: 0,
    percentComplete: totalDays === 0 ? 0 : Math.round((dayNumber / totalDays) * 1000) / 10,
  };
}
