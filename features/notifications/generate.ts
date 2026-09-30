import { STREAK_MILESTONES, WEEKLY_REVIEW_WEEKDAY } from "@/lib/constants";
import { weekdayOf, type ISODate } from "@/lib/dates";
import { formatCurrency, formatMinutes } from "@/lib/format";
import type { NotificationKind } from "@/types/database";

export interface NotificationCandidate {
  dedupe_key: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string;
}

export interface NotificationInput {
  today: ISODate;
  /** Local hour (0–23) in the user's timezone. */
  hour: number;
  weekStart: ISODate;
  monthKey: string;
  followupsDueToday: number;
  overdueFollowups: number;
  learningMinutesToday: number;
  learningTargetMinutes: number;
  weeklyReviewDone: boolean;
  currentStreak: number;
  challengeId: string;
  savingsThisMonth: number;
  monthlySavingsGoal: number;
  currency: string;
}

/** Evening hour after which an unmet learning target triggers a reminder. */
export const LEARNING_REMINDER_HOUR = 18;

/** Pure: decides which reminders apply right now. Keys make inserts idempotent. */
export function buildNotifications(input: NotificationInput): NotificationCandidate[] {
  const out: NotificationCandidate[] = [];

  if (input.followupsDueToday > 0) {
    out.push({
      dedupe_key: `followups:${input.today}`,
      kind: "followup",
      title: `${input.followupsDueToday} follow-up${input.followupsDueToday === 1 ? "" : "s"} due today`,
      body: "Close the loop while the conversation is warm.",
      href: "/clients",
    });
  }
  if (input.overdueFollowups > 0) {
    out.push({
      dedupe_key: `overdue:${input.today}`,
      kind: "followup",
      title: `${input.overdueFollowups} overdue follow-up${input.overdueFollowups === 1 ? "" : "s"}`,
      body: null,
      href: "/clients",
    });
  }
  if (
    input.hour >= LEARNING_REMINDER_HOUR &&
    input.learningTargetMinutes > 0 &&
    input.learningMinutesToday < input.learningTargetMinutes
  ) {
    out.push({
      dedupe_key: `learning:${input.today}`,
      kind: "learning",
      title: "Learning target incomplete",
      body: `${formatMinutes(input.learningMinutesToday)} of ${formatMinutes(input.learningTargetMinutes)} so far today.`,
      href: "/learning",
    });
  }
  if (weekdayOf(input.today) === WEEKLY_REVIEW_WEEKDAY && !input.weeklyReviewDone) {
    out.push({
      dedupe_key: `review:${input.weekStart}`,
      kind: "weekly_review",
      title: "Weekly review due",
      body: "Ten minutes to look back before the next week starts.",
      href: "/weekly-review",
    });
  }
  const milestone = [...STREAK_MILESTONES].reverse().find((m) => input.currentStreak >= m);
  if (milestone && input.currentStreak === milestone) {
    out.push({
      dedupe_key: `streak:${input.challengeId}:${milestone}`,
      kind: "streak",
      title: `You reached a ${milestone}-day streak`,
      body: "Consistency beats intensity.",
      href: "/analytics",
    });
  }
  if (input.monthlySavingsGoal > 0 && input.savingsThisMonth >= input.monthlySavingsGoal) {
    out.push({
      dedupe_key: `savings:${input.monthKey}`,
      kind: "savings",
      title: "Monthly savings target reached",
      body: `${formatCurrency(input.savingsThisMonth, input.currency)} saved this month.`,
      href: "/money",
    });
  }
  return out;
}
