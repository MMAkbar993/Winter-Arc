import { z } from "zod";
import { isISODate } from "@/lib/dates";

/**
 * Field builders shared by every form schema.
 *
 * Forms keep raw string values (what inputs actually produce). Each schema's
 * *input* type is therefore string-based and its *output* type is the parsed
 * domain value. The client validates for inline messages, and server actions
 * re-parse the same raw input — the client is never trusted.
 */

const MAX_MONEY = 100_000_000_000;

/** Removes ASCII control characters (keeps newlines and tabs). */
function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export const requiredText = (label: string, max = 200) =>
  z
    .string({ error: `${label} is required` })
    .transform(stripControlChars)
    .pipe(
      z
        .string()
        .trim()
        .min(1, `${label} is required`)
        .max(max, `${label} must be ${max} characters or fewer`),
    );

export const optionalText = (label: string, max = 2000) =>
  z
    .string()
    .optional()
    .transform((v) => stripControlChars(v ?? "").trim())
    .pipe(z.string().max(max, `${label} must be ${max} characters or fewer`))
    .transform((v) => (v === "" ? null : v));

export const optionalUrl = (label = "URL") =>
  z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), `${label} must start with http:// or https://`)
    .refine((v) => v.length <= 2048, `${label} is too long`)
    .transform((v) => (v === "" ? null : v));

export const isoDate = (label = "Date") =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .refine(isISODate, `${label} must be a valid date`);

export const optionalIsoDate = (label = "Date") =>
  z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .refine((v) => v === "" || isISODate(v), `${label} must be a valid date`)
    .transform((v) => (v === "" ? null : v));

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Required money amount > 0. Accepts "1,500" and "1500.50". */
export const moneyAmount = (label = "Amount") =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .transform((v, ctx) => {
      const n = parseNumber(v);
      if (n === null) {
        ctx.addIssue({ code: "custom", message: `${label} must be a number` });
        return z.NEVER;
      }
      if (n <= 0) {
        ctx.addIssue({ code: "custom", message: `${label} must be greater than 0` });
        return z.NEVER;
      }
      if (n > MAX_MONEY) {
        ctx.addIssue({ code: "custom", message: `${label} is too large` });
        return z.NEVER;
      }
      return Math.round(n * 100) / 100;
    });

interface NumberOptions {
  min?: number;
  max?: number;
  integer?: boolean;
}

function numberFromString(label: string, required: boolean, { min = 0, max = MAX_MONEY, integer = false }: NumberOptions) {
  return z
    .string()
    .optional()
    .transform((v, ctx): number | null => {
      const raw = (v ?? "").trim();
      if (raw === "") {
        if (required) {
          ctx.addIssue({ code: "custom", message: `${label} is required` });
          return z.NEVER;
        }
        return null;
      }
      const n = parseNumber(raw);
      if (n === null) {
        ctx.addIssue({ code: "custom", message: `${label} must be a number` });
        return z.NEVER;
      }
      if (integer && !Number.isInteger(n)) {
        ctx.addIssue({ code: "custom", message: `${label} must be a whole number` });
        return z.NEVER;
      }
      if (n < min) {
        ctx.addIssue({
          code: "custom",
          message: min === 0 ? `${label} cannot be negative` : `${label} must be at least ${min}`,
        });
        return z.NEVER;
      }
      if (n > max) {
        ctx.addIssue({ code: "custom", message: `${label} must be at most ${max}` });
        return z.NEVER;
      }
      return n;
    });
}

export const requiredNumber = (label: string, options: NumberOptions = {}) =>
  numberFromString(label, true, options).transform((v) => v as number);

export const optionalNumber = (label: string, options: NumberOptions = {}) => numberFromString(label, false, options);

/** Duration in whole minutes, 1..1440. */
export const durationMinutes = (label = "Duration") =>
  requiredNumber(label, { min: 1, max: 1440, integer: true });

export const timeOfDay = (label: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .refine((v) => v === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), `${label} must be a valid time (HH:MM)`)
    .transform((v) => (v === "" ? null : v));

export const uuid = (label = "Record") => z.uuid({ error: `${label} is invalid` });

export const optionalUuid = () =>
  z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .refine((v) => v === "" || z.uuid().safeParse(v).success, "Invalid selection")
    .transform((v) => (v === "" ? null : v));

export const enumField = <const T extends readonly [string, ...string[]]>(values: T, label: string) =>
  z.enum(values, { error: `Choose a ${label.toLowerCase()}` });
