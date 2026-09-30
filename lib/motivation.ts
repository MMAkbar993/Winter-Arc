import { MOTIVATIONAL_LINES } from "@/lib/constants";
import { parseISODate } from "@/lib/dates";

/** One calm line per day — deterministic, so it doesn't change on refresh. */
export function motivationForDate(date: string): string {
  const d = parseISODate(date);
  const dayIndex = Math.floor(d.getTime() / 86_400_000);
  return MOTIVATIONAL_LINES[((dayIndex % MOTIVATIONAL_LINES.length) + MOTIVATIONAL_LINES.length) % MOTIVATIONAL_LINES.length]!;
}
