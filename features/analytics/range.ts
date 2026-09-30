import { addDaysISO, isISODate, maxISO, minISO, startOfMonthISO, startOfWeekISO, type ISODate } from "@/lib/dates";

export const RANGE_PRESETS = [
  { value: "challenge", label: "Challenge" },
  { value: "week", label: "This week" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "month", label: "This month" },
  { value: "90d", label: "90 days" },
] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number]["value"];

/** Longest range analytics will load (daily_series allows 800 days). */
export const MAX_RANGE_DAYS = 366;

export interface ResolvedRange {
  from: ISODate;
  to: ISODate;
  preset: RangePreset | null;
}

/** Turns ?range= / ?from=&to= into a safe, clamped date range ending no later than today. */
export function resolveRange(
  params: { range?: string | string[]; from?: string | string[]; to?: string | string[] },
  ctx: { today: ISODate; challengeStart: ISODate; challengeEnd: ISODate },
): ResolvedRange {
  const { today, challengeStart, challengeEnd } = ctx;
  const pick = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const from = pick(params.from);
  const to = pick(params.to);

  if (from && to && isISODate(from) && isISODate(to) && from <= to) {
    const end = minISO(to, today);
    const start = maxISO(minISO(from, end), addDaysISO(end, -(MAX_RANGE_DAYS - 1)));
    return { from: start, to: end, preset: null };
  }

  const challengeStarted = challengeStart <= today;
  const requested = pick(params.range);
  const preset: RangePreset = RANGE_PRESETS.some((p) => p.value === requested)
    ? (requested as RangePreset)
    : challengeStarted
      ? "challenge"
      : "30d";

  switch (preset) {
    case "challenge":
      if (!challengeStarted) return { from: addDaysISO(today, -29), to: today, preset };
      return { from: maxISO(challengeStart, addDaysISO(today, -(MAX_RANGE_DAYS - 1))), to: minISO(challengeEnd, today), preset };
    case "week":
      return { from: startOfWeekISO(today), to: today, preset };
    case "7d":
      return { from: addDaysISO(today, -6), to: today, preset };
    case "month":
      return { from: startOfMonthISO(today), to: today, preset };
    case "90d":
      return { from: addDaysISO(today, -89), to: today, preset };
    case "30d":
    default:
      return { from: addDaysISO(today, -29), to: today, preset: "30d" };
  }
}
