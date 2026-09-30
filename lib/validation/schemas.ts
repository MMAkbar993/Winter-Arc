import { z } from "zod";
import {
  CONTENT_PLATFORM_VALUES,
  CONTENT_STATUS_VALUES,
  CONTENT_TYPE_VALUES,
  CURRENCIES,
  EXPENSE_CATEGORY_VALUES,
  HABIT_KEYS,
  INCOME_CATEGORY_VALUES,
  LEARNING_CATEGORY_VALUES,
  PRIORITY_KIND_VALUES,
  PROJECT_STATUS_VALUES,
  PROSPECT_SOURCE_VALUES,
  PROSPECT_STAGE_VALUES,
  SAVINGS_KIND_VALUES,
  THEME_VALUES,
  WORKOUT_CATEGORY_VALUES,
} from "@/lib/constants";
import { diffDaysISO, isISODate, isValidTimeZone } from "@/lib/dates";
import {
  durationMinutes,
  enumField,
  isoDate,
  moneyAmount,
  optionalIsoDate,
  optionalNumber,
  optionalText,
  optionalUrl,
  optionalUuid,
  requiredNumber,
  requiredText,
  timeOfDay,
  uuid,
} from "@/lib/validation/fields";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: requiredText("Name", 120),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

// ---------------------------------------------------------------------------
// Challenge / onboarding / settings
// ---------------------------------------------------------------------------
const timezone = z
  .string()
  .trim()
  .min(1, "Timezone is required")
  .refine(isValidTimeZone, "Choose a valid timezone");

const challengeDates = <T extends z.ZodType<{ startDate: string; endDate: string }>>(schema: T) =>
  schema.superRefine((v, ctx) => {
    // Field-level date errors are reported separately; only compare valid dates.
    if (!isISODate(v.startDate) || !isISODate(v.endDate)) return;
    if (v.endDate <= v.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be after the start date" });
    } else if (diffDaysISO(v.endDate, v.startDate) > 730) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "A challenge can be at most 2 years long" });
    }
  });

const targetFields = {
  dailyLearningTargetMinutes: requiredNumber("Daily learning target", { min: 0, max: 1440, integer: true }),
  weeklyWorkoutTarget: requiredNumber("Weekly workout target", { min: 0, max: 14, integer: true }),
  dailyOutreachTarget: requiredNumber("Daily outreach target", { min: 0, max: 500, integer: true }),
  monthlyIncomeGoal: requiredNumber("Monthly income goal", { min: 0 }),
  monthlySavingsGoal: requiredNumber("Monthly savings goal", { min: 0 }),
};

export const onboardingSchema = challengeDates(
  z.object({
    name: requiredText("Name", 120),
    challengeName: requiredText("Challenge name", 80),
    startDate: isoDate("Start date"),
    endDate: isoDate("End date"),
    timezone,
    ...targetFields,
  }),
);

export const profileSettingsSchema = z.object({
  name: requiredText("Name", 120),
});

export const challengeSettingsSchema = challengeDates(
  z.object({
    challengeName: requiredText("Challenge name", 80),
    startDate: isoDate("Start date"),
    endDate: isoDate("End date"),
  }),
);

export const preferencesSettingsSchema = z.object({
  timezone,
  currency: z.enum(CURRENCIES, { error: "Choose a currency" }),
  theme: z.enum(THEME_VALUES),
  successThreshold: requiredNumber("Successful-day threshold", { min: 1, max: 7, integer: true }),
});

export const targetsSettingsSchema = z.object(targetFields);

// ---------------------------------------------------------------------------
// Daily habits & priorities
// ---------------------------------------------------------------------------
export const toggleHabitSchema = z.object({
  date: isoDate(),
  habitKey: z.enum(HABIT_KEYS),
  completed: z.boolean(),
});

export const habitNoteSchema = z.object({
  date: isoDate(),
  habitKey: z.enum(HABIT_KEYS),
  notes: optionalText("Notes", 1000),
});

export const priorityUpsertSchema = z.object({
  date: isoDate(),
  kind: z.enum(PRIORITY_KIND_VALUES),
  title: requiredText("Task", 200),
});

export const priorityToggleSchema = z.object({
  date: isoDate(),
  kind: z.enum(PRIORITY_KIND_VALUES),
  completed: z.boolean(),
});

export const dailyNoteSchema = z.object({
  date: isoDate(),
  notes: optionalText("Note", 5000),
});

// ---------------------------------------------------------------------------
// Fitness
// ---------------------------------------------------------------------------
export const exerciseSchema = z.object({
  name: requiredText("Exercise", 80),
  sets: optionalNumber("Sets", { max: 100, integer: true }),
  reps: optionalNumber("Reps", { max: 1000, integer: true }),
  weight: optionalNumber("Weight", { max: 2000 }),
});

export const workoutSchema = z
  .object({
    date: isoDate(),
    category: enumField(WORKOUT_CATEGORY_VALUES, "Category"),
    customCategory: optionalText("Custom category", 60),
    duration: requiredNumber("Duration", { min: 0, max: 1440, integer: true }),
    notes: optionalText("Notes", 2000),
    exercises: z.array(exerciseSchema).max(40, "Up to 40 exercises per workout"),
  })
  .refine((v) => v.category !== "custom" || !!v.customCategory, {
    path: ["customCategory"],
    message: "Name your custom workout",
  });

export const bodyMetricSchema = z
  .object({
    date: isoDate(),
    bodyWeight: optionalNumber("Body weight", { min: 1, max: 499 }),
    waist: optionalNumber("Waist", { min: 1, max: 299 }),
    chest: optionalNumber("Chest", { min: 1, max: 299 }),
    arms: optionalNumber("Arms", { min: 1, max: 149 }),
    photoUrl: optionalUrl("Photo URL"),
    notes: optionalText("Notes", 1000),
  })
  .refine((v) => v.bodyWeight !== null || v.waist !== null || v.chest !== null || v.arms !== null, {
    path: ["bodyWeight"],
    message: "Enter at least one measurement",
  });

// ---------------------------------------------------------------------------
// Learning
// ---------------------------------------------------------------------------
export const learningSessionSchema = z.object({
  date: isoDate(),
  topic: requiredText("Topic", 160),
  category: enumField(LEARNING_CATEGORY_VALUES, "Category"),
  duration: durationMinutes(),
  resource: optionalText("Resource", 300),
  notes: optionalText("Notes", 2000),
  projectId: optionalUuid(),
  completed: z.boolean(),
});

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------
export const prospectSchema = z.object({
  name: requiredText("Prospect name", 120),
  company: optionalText("Company", 120),
  source: enumField(PROSPECT_SOURCE_VALUES, "Source"),
  profileUrl: optionalUrl("Profile / website URL"),
  contactMethod: optionalText("Contact method", 120),
  serviceNeeded: optionalText("Service needed", 200),
  estimatedValue: optionalNumber("Estimated value"),
  stage: enumField(PROSPECT_STAGE_VALUES, "Stage"),
  contactedOn: optionalIsoDate("Date contacted"),
  nextFollowUpOn: optionalIsoDate("Next follow-up date"),
  followUpNotes: optionalText("Follow-up notes", 2000),
  notes: optionalText("Notes", 5000),
});

export const prospectStageSchema = z.object({
  id: uuid("Prospect"),
  stage: z.enum(PROSPECT_STAGE_VALUES),
});

export const followupSchema = z.object({
  prospectId: uuid("Prospect"),
  dueOn: isoDate("Follow-up date"),
  notes: optionalText("Notes", 2000),
});

export const completeFollowupSchema = z.object({
  id: uuid("Follow-up"),
  status: z.enum(["done", "skipped"]),
  nextDueOn: optionalIsoDate("Next follow-up date"),
});

export const outreachLogSchema = z.object({
  date: isoDate(),
  source: enumField(PROSPECT_SOURCE_VALUES, "Platform"),
  count: requiredNumber("Actions", { min: 1, max: 500, integer: true }),
  notes: optionalText("Notes", 1000),
});

// ---------------------------------------------------------------------------
// Projects & work
// ---------------------------------------------------------------------------
export const projectSchema = z.object({
  name: requiredText("Project name", 120),
  clientName: optionalText("Client", 120),
  status: enumField(PROJECT_STATUS_VALUES, "Status"),
  description: optionalText("Description", 2000),
});

export const workSessionSchema = z
  .object({
    projectId: uuid("Project"),
    date: isoDate(),
    task: requiredText("Task", 200),
    startTime: timeOfDay("Start time"),
    endTime: timeOfDay("End time"),
    duration: optionalNumber("Duration", { min: 1, max: 1440, integer: true }),
    billable: z.boolean(),
    amountEarned: optionalNumber("Amount earned"),
    notes: optionalText("Notes", 2000),
  })
  .transform((v, ctx) => {
    let duration = v.duration;
    if (v.startTime && v.endTime) {
      const computed = minutesBetween(v.startTime, v.endTime);
      if (computed <= 0) {
        ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time" });
        return z.NEVER;
      }
      duration = duration ?? computed;
    }
    if (duration === null) {
      ctx.addIssue({ code: "custom", path: ["duration"], message: "Enter a duration or start and end times" });
      return z.NEVER;
    }
    return { ...v, duration, amountEarned: v.amountEarned ?? 0 };
  });

export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh ?? 0) * 60 + (em ?? 0) - ((sh ?? 0) * 60 + (sm ?? 0));
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
export const contentItemSchema = z.object({
  platform: enumField(CONTENT_PLATFORM_VALUES, "Platform"),
  date: isoDate(),
  contentType: enumField(CONTENT_TYPE_VALUES, "Content type"),
  title: requiredText("Title / hook", 300),
  url: optionalUrl("Content URL"),
  status: enumField(CONTENT_STATUS_VALUES, "Status"),
  notes: optionalText("Notes", 2000),
});

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------
export const incomeSchema = z.object({
  date: isoDate(),
  amount: moneyAmount(),
  source: optionalText("Source", 120),
  client: optionalText("Client", 120),
  projectId: optionalUuid(),
  category: enumField(INCOME_CATEGORY_VALUES, "Category"),
  notes: optionalText("Notes", 1000),
});

export const expenseSchema = z.object({
  date: isoDate(),
  amount: moneyAmount(),
  category: enumField(EXPENSE_CATEGORY_VALUES, "Category"),
  notes: optionalText("Notes", 1000),
});

export const savingsSchema = z.object({
  date: isoDate(),
  amount: moneyAmount(),
  kind: enumField(SAVINGS_KIND_VALUES, "Type"),
  notes: optionalText("Notes", 1000),
});

// ---------------------------------------------------------------------------
// Reflection
// ---------------------------------------------------------------------------
export const weeklyReviewSchema = z.object({
  weekStart: isoDate("Week"),
  built: optionalText("Answer", 5000),
  learned: optionalText("Answer", 5000),
  prospects_contacted: optionalText("Answer", 2000),
  money_earned: optionalText("Answer", 2000),
  money_saved: optionalText("Answer", 2000),
  time_wasters: optionalText("Answer", 5000),
  went_well: optionalText("Answer", 5000),
  improve_next: optionalText("Answer", 5000),
  reflection: optionalText("Reflection", 10000),
});

const scale = (label: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .refine((v) => v === "" || /^[1-5]$/.test(v), `${label} must be between 1 and 5`)
    .transform((v) => (v === "" ? null : Number(v)));

export const journalSchema = z.object({
  date: isoDate(),
  mood: scale("Mood"),
  energy: scale("Energy"),
  notes: optionalText("Notes", 10000),
  gratitude: optionalText("Gratitude", 2000),
  biggestWin: optionalText("Biggest win", 2000),
  biggestChallenge: optionalText("Biggest challenge", 2000),
});

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------
export const idSchema = z.object({ id: uuid() });
export const searchSchema = z.object({ query: z.string().trim().min(2).max(100) });

export type LoginInput = z.input<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type OnboardingInput = z.input<typeof onboardingSchema>;
export type WorkoutInput = z.input<typeof workoutSchema>;
export type BodyMetricInput = z.input<typeof bodyMetricSchema>;
export type LearningSessionInput = z.input<typeof learningSessionSchema>;
export type ProspectInput = z.input<typeof prospectSchema>;
export type OutreachLogInput = z.input<typeof outreachLogSchema>;
export type ProjectInput = z.input<typeof projectSchema>;
export type WorkSessionInput = z.input<typeof workSessionSchema>;
export type ContentItemInput = z.input<typeof contentItemSchema>;
export type IncomeInput = z.input<typeof incomeSchema>;
export type ExpenseInput = z.input<typeof expenseSchema>;
export type SavingsInput = z.input<typeof savingsSchema>;
export type WeeklyReviewInput = z.input<typeof weeklyReviewSchema>;
export type JournalInput = z.input<typeof journalSchema>;
