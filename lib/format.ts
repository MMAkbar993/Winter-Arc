const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** "PKR 100,000" — rounded to whole units, which is how people think about targets. */
export function formatCurrency(amount: number, currency: string): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency} ${integerFormatter.format(Math.abs(amount))}`;
}

/** Compact variant for chart axes: "PKR 12.5k". */
export function formatCurrencyCompact(amount: number, currency: string): string {
  return `${currency} ${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(amount)}`;
}

export function formatNumber(n: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: fractionDigits }).format(n);
}

/** 80 → "1h 20m", 120 → "2h", 45 → "45m", 0 → "0m" */
export function formatMinutes(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** 90 → 1.5 */
export function minutesToHours(minutes: number, fractionDigits = 1): number {
  const factor = 10 ** fractionDigits;
  return Math.round((minutes / 60) * factor) / factor;
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "WA";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "WA";
}
