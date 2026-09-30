import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { WEEK_STARTS_ON } from "@/lib/constants";

/**
 * Calendar days are handled as `yyyy-MM-dd` strings ("ISO dates") everywhere
 * in the app. They are the user's *local* day in their configured timezone,
 * never a UTC slice of an instant. Arithmetic on them is done by parsing into a
 * local Date at midnight, which is timezone-agnostic for day math.
 */
export type ISODate = string;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isISODate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const d = parse(value, "yyyy-MM-dd", new Date());
  return isValid(d) && format(d, "yyyy-MM-dd") === value;
}

export function parseISODate(value: ISODate): Date {
  const d = parse(value, "yyyy-MM-dd", new Date());
  if (!isValid(d)) throw new Error(`Invalid ISO date: ${value}`);
  return d;
}

export function toISODate(date: Date): ISODate {
  return format(date, "yyyy-MM-dd");
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The user's local calendar date for an instant (defaults to now). */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): ISODate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Hour of day (0–23) in the given timezone. */
export function hourInTimeZone(timeZone: string, now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(now);
  return Number.parseInt(hour, 10) % 24;
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function addDaysISO(date: ISODate, amount: number): ISODate {
  return toISODate(addDays(parseISODate(date), amount));
}

/** Calendar days from `from` to `to` (positive when `to` is later). */
export function diffDaysISO(to: ISODate, from: ISODate): number {
  return differenceInCalendarDays(parseISODate(to), parseISODate(from));
}

export function eachDayISO(start: ISODate, end: ISODate): ISODate[] {
  if (end < start) return [];
  return eachDayOfInterval({ start: parseISODate(start), end: parseISODate(end) }).map(toISODate);
}

export function startOfWeekISO(date: ISODate): ISODate {
  return toISODate(startOfWeek(parseISODate(date), { weekStartsOn: WEEK_STARTS_ON }));
}

export function endOfWeekISO(date: ISODate): ISODate {
  return toISODate(endOfWeek(parseISODate(date), { weekStartsOn: WEEK_STARTS_ON }));
}

export function startOfMonthISO(date: ISODate): ISODate {
  return toISODate(startOfMonth(parseISODate(date)));
}

export function endOfMonthISO(date: ISODate): ISODate {
  return toISODate(endOfMonth(parseISODate(date)));
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(date: ISODate): number {
  return parseISODate(date).getDay();
}

export function minISO(a: ISODate, b: ISODate): ISODate {
  return a < b ? a : b;
}

export function maxISO(a: ISODate, b: ISODate): ISODate {
  return a > b ? a : b;
}

export function formatISODate(date: ISODate, pattern = "MMM d, yyyy"): string {
  return format(parseISODate(date), pattern);
}

/** "yyyy-MM" month key → first day of that month, or null if invalid. */
export function monthKeyToISO(monthKey: string | undefined | null): ISODate | null {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return null;
  const candidate = `${monthKey}-01`;
  return isISODate(candidate) ? candidate : null;
}

export const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
