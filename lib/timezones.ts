import { DEFAULT_TIMEZONE } from "@/lib/constants";

/** All IANA timezones the runtime knows, with the default guaranteed present. */
export function timezoneOptions(): { value: string; label: string }[] {
  const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [DEFAULT_TIMEZONE];
  const set = new Set([DEFAULT_TIMEZONE, "UTC", ...zones]);
  return [...set].sort().map((z) => ({ value: z, label: z.replace(/_/g, " ") }));
}
