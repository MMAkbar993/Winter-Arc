/**
 * Single source of truth for product copy, enumerations and defaults.
 * Enumeration values mirror the CHECK constraints in supabase/migrations.
 */

export const APP_NAME = "Winter Arc OS";
export const TAGLINE = "Build in silence. Show results.";

export const MOTIVATIONAL_LINES = [
  "Build in silence. Show results.",
  "No zero days.",
  "Consistency beats intensity.",
  "Another day. Another rep.",
  "Do the work before the motivation arrives.",
] as const;

export const DEFAULT_CHALLENGE = {
  name: "Winter Arc 2026",
  startDate: "2026-10-01",
  endDate: "2026-12-31",
} as const;

export const DEFAULT_TIMEZONE = "Asia/Karachi";
export const DEFAULT_CURRENCY = "PKR";

export const DEFAULT_TARGETS = {
  dailyLearningMinutes: 120,
  weeklyWorkouts: 5,
  dailyOutreach: 15,
  monthlyIncomeGoal: 0,
  monthlySavingsGoal: 0,
  successThreshold: 5,
} as const;

/** Week boundaries: Monday → Sunday. Weekly reviews happen on Sunday. */
export const WEEK_STARTS_ON = 1 as const;
export const WEEKLY_REVIEW_WEEKDAY = 0 as const; // Sunday

type Option<V extends string> = { readonly value: V; readonly label: string; readonly [extra: string]: unknown };

function values<const T extends readonly Option<string>[]>(options: T) {
  return options.map((o) => o.value) as unknown as readonly [T[number]["value"], ...T[number]["value"][]];
}

export function labelFor<V extends string>(options: readonly Option<V>[], value: V | null | undefined): string {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label ?? value;
}

// ---------------------------------------------------------------------------
// Daily Seven
// ---------------------------------------------------------------------------
export const HABITS = [
  { value: "workout", label: "Workout", mission: "Workout", description: "Train or move with intent" },
  { value: "learning", label: "Learning", mission: "2 Hours Learning", description: "Two focused hours of study" },
  { value: "outreach", label: "Client Outreach", mission: "Client Outreach", description: "Hit your outreach target" },
  { value: "client_work", label: "Client / Project Work", mission: "Client Work", description: "Deep work on paid projects" },
  { value: "content", label: "Content Posted", mission: "Post Content", description: "Publish one piece of content" },
  { value: "screen_time", label: "Controlled Screen Time", mission: "Control Screen Time", description: "No mindless scrolling" },
  { value: "sleep", label: "Sleep Routine", mission: "Sleep On Time", description: "Wind down and sleep on schedule" },
] as const satisfies readonly Option<string>[];
export type HabitKey = (typeof HABITS)[number]["value"];
export const HABIT_KEYS = values(HABITS);
export const MAX_DAILY_SCORE = HABITS.length;

export const PRIORITY_KINDS = [
  { value: "income", label: "Income Task", placeholder: "e.g. Send proposal to Ali" },
  { value: "skill", label: "Skill Task", placeholder: "e.g. Finish Next.js caching module" },
  { value: "health", label: "Health / Personal Task", placeholder: "e.g. 8k steps + stretch" },
] as const satisfies readonly Option<string>[];
export type PriorityKind = (typeof PRIORITY_KINDS)[number]["value"];
export const PRIORITY_KIND_VALUES = values(PRIORITY_KINDS);

// ---------------------------------------------------------------------------
// Fitness
// ---------------------------------------------------------------------------
export const WORKOUT_CATEGORIES = [
  { value: "chest_triceps", label: "Chest + Triceps" },
  { value: "back_biceps", label: "Back + Biceps" },
  { value: "legs", label: "Legs" },
  { value: "shoulders_abs", label: "Shoulders + Abs" },
  { value: "upper_body", label: "Upper Body" },
  { value: "walking", label: "Walking" },
  { value: "sport", label: "Sport" },
  { value: "cardio", label: "Cardio" },
  { value: "custom", label: "Custom" },
] as const satisfies readonly Option<string>[];
export type WorkoutCategory = (typeof WORKOUT_CATEGORIES)[number]["value"];
export const WORKOUT_CATEGORY_VALUES = values(WORKOUT_CATEGORIES);

export const COMMON_EXERCISES = [
  "Bench Press", "Incline Dumbbell Press", "Push-ups", "Tricep Dips", "Skull Crushers",
  "Pull-ups", "Barbell Row", "Lat Pulldown", "Bicep Curl", "Hammer Curl",
  "Squat", "Romanian Deadlift", "Lunges", "Leg Press", "Calf Raises",
  "Overhead Press", "Lateral Raise", "Plank", "Hanging Leg Raise", "Deadlift",
] as const;

// ---------------------------------------------------------------------------
// Learning
// ---------------------------------------------------------------------------
export const LEARNING_CATEGORIES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "react", label: "React" },
  { value: "nextjs", label: "Next.js" },
  { value: "nodejs", label: "Node.js" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "supabase", label: "Supabase" },
  { value: "apis", label: "APIs" },
  { value: "ai", label: "AI" },
  { value: "system_design", label: "System Design" },
  { value: "devops", label: "DevOps" },
  { value: "security", label: "Security" },
  { value: "git", label: "Git/GitHub" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option<string>[];
export type LearningCategory = (typeof LEARNING_CATEGORIES)[number]["value"];
export const LEARNING_CATEGORY_VALUES = values(LEARNING_CATEGORIES);

// ---------------------------------------------------------------------------
// Client acquisition
// ---------------------------------------------------------------------------
export const PROSPECT_SOURCES = [
  { value: "fiverr", label: "Fiverr" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X" },
  { value: "email", label: "Email" },
  { value: "referral", label: "Referral" },
  { value: "upwork", label: "Upwork" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option<string>[];
export type ProspectSource = (typeof PROSPECT_SOURCES)[number]["value"];
export const PROSPECT_SOURCE_VALUES = values(PROSPECT_SOURCES);

export const PROSPECT_STAGES = [
  { value: "identified", label: "Identified" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "qualified", label: "Qualified" },
  { value: "call_scheduled", label: "Call Scheduled" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "negotiating", label: "Negotiating" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const satisfies readonly Option<string>[];
export type ProspectStage = (typeof PROSPECT_STAGES)[number]["value"];
export const PROSPECT_STAGE_VALUES = values(PROSPECT_STAGES);

/** Stages that imply the prospect has replied at some point. */
export const REPLIED_STAGES: readonly ProspectStage[] = [
  "replied", "qualified", "call_scheduled", "proposal_sent", "negotiating", "won",
];
/** Stages that imply the prospect has been contacted. */
export const CONTACTED_STAGES: readonly ProspectStage[] = [
  "contacted", ...REPLIED_STAGES,
];
/** Stages still counted in the open pipeline value. */
export const OPEN_PIPELINE_STAGES: readonly ProspectStage[] = [
  "identified", "contacted", "replied", "qualified", "call_scheduled", "proposal_sent", "negotiating",
];

export const FOLLOWUP_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "done", label: "Done" },
  { value: "skipped", label: "Skipped" },
] as const satisfies readonly Option<string>[];
export type FollowupStatus = (typeof FOLLOWUP_STATUSES)[number]["value"];

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const PROJECT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "waiting", label: "Waiting" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
] as const satisfies readonly Option<string>[];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];
export const PROJECT_STATUS_VALUES = values(PROJECT_STATUSES);

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
export const CONTENT_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option<string>[];
export type ContentPlatform = (typeof CONTENT_PLATFORMS)[number]["value"];
export const CONTENT_PLATFORM_VALUES = values(CONTENT_PLATFORMS);

export const CONTENT_TYPES = [
  { value: "build_in_public", label: "Build in Public" },
  { value: "coding_tip", label: "Coding Tip" },
  { value: "client_result", label: "Client Result" },
  { value: "case_study", label: "Case Study" },
  { value: "productivity", label: "Productivity" },
  { value: "portfolio", label: "Portfolio" },
  { value: "personal_insight", label: "Personal Insight" },
  { value: "short_video", label: "Short Video" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option<string>[];
export type ContentType = (typeof CONTENT_TYPES)[number]["value"];
export const CONTENT_TYPE_VALUES = values(CONTENT_TYPES);

export const CONTENT_STATUSES = [
  { value: "idea", label: "Idea" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
] as const satisfies readonly Option<string>[];
export type ContentStatus = (typeof CONTENT_STATUSES)[number]["value"];
export const CONTENT_STATUS_VALUES = values(CONTENT_STATUSES);

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------
export const INCOME_CATEGORIES = [
  { value: "fiverr", label: "Fiverr" },
  { value: "direct_client", label: "Direct Client" },
  { value: "freelance", label: "Freelance" },
  { value: "salary", label: "Salary" },
  { value: "referral", label: "Referral" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option<string>[];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]["value"];
export const INCOME_CATEGORY_VALUES = values(INCOME_CATEGORIES);

export const EXPENSE_CATEGORIES = [
  { value: "essential", label: "Essential" },
  { value: "business", label: "Business" },
  { value: "education", label: "Education" },
  { value: "family", label: "Family" },
  { value: "personal", label: "Personal" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option<string>[];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];
export const EXPENSE_CATEGORY_VALUES = values(EXPENSE_CATEGORIES);

/** Expense categories counted as "business investment". */
export const BUSINESS_INVESTMENT_CATEGORIES: readonly ExpenseCategory[] = ["business", "education"];

export const SAVINGS_KINDS = [
  { value: "deposit", label: "Deposit" },
  { value: "withdrawal", label: "Withdrawal" },
] as const satisfies readonly Option<string>[];
export type SavingsKind = (typeof SAVINGS_KINDS)[number]["value"];
export const SAVINGS_KIND_VALUES = values(SAVINGS_KINDS);

/** Optional reference split — never enforced. Percentages sum to 100. */
export const BUDGET_GUIDANCE = [
  { key: "necessary", label: "Necessary expenses", percent: 40, categories: ["essential"] },
  { key: "savings", label: "Savings", percent: 25, categories: [] },
  { key: "growth", label: "Skills / business", percent: 15, categories: ["business", "education"] },
  { key: "family", label: "Family / personal", percent: 10, categories: ["family", "personal"] },
  { key: "fun", label: "Fun", percent: 10, categories: ["entertainment", "other"] },
] as const satisfies readonly {
  key: string;
  label: string;
  percent: number;
  categories: readonly ExpenseCategory[];
}[];

export const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED", "SAR", "INR", "CAD", "AUD"] as const;

export const THEMES = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
] as const satisfies readonly Option<string>[];
export type ThemePreference = (typeof THEMES)[number]["value"];
export const THEME_VALUES = values(THEMES);

export const JOURNAL_SCALE = [1, 2, 3, 4, 5] as const;
export const MOOD_LABELS: Record<number, string> = { 1: "Rough", 2: "Low", 3: "Okay", 4: "Good", 5: "Great" };
export const ENERGY_LABELS: Record<number, string> = { 1: "Drained", 2: "Tired", 3: "Steady", 4: "Energized", 5: "Peak" };

export const WEEKLY_REVIEW_QUESTIONS = [
  { key: "built", label: "What did I build this week?" },
  { key: "learned", label: "What did I learn?" },
  { key: "prospects_contacted", label: "How many prospects did I contact?" },
  { key: "money_earned", label: "How much money did I earn?" },
  { key: "money_saved", label: "How much did I save?" },
  { key: "time_wasters", label: "What wasted most of my time?" },
  { key: "went_well", label: "What went well?" },
  { key: "improve_next", label: "What will I improve next week?" },
] as const;
export type WeeklyReviewQuestionKey = (typeof WEEKLY_REVIEW_QUESTIONS)[number]["key"];

export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 45, 60, 75, 92] as const;
