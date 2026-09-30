/** Mutable copies of option lists for select components. */
export function toOptions<T extends { value: string; label: string }>(list: readonly T[]) {
  return list.map((o) => ({ value: o.value, label: o.label }));
}

/** "" for null/undefined, string otherwise — form inputs hold strings. */
export function str(value: string | number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}
