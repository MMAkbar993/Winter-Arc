/**
 * Only allow same-origin relative redirects ("/today", "/clients?view=table").
 * Rejects protocol-relative ("//evil.com"), backslash tricks and absolute URLs.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001F\u007F]/.test(value)) return fallback;
  return value;
}
