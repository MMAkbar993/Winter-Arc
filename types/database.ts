/**
 * Supabase database types.
 *
 * Mirrors supabase/migrations. It follows the shape produced by
 * `supabase gen types typescript`, with enumerated text columns narrowed to
 * the unions in lib/constants.ts. If you change the schema, update this file
 * (or regenerate and re-apply the narrowing).
 */
import type {
  ContentPlatform,
  ContentStatus,
  ContentType,
  ExpenseCategory,
  FollowupStatus,
  HabitKey,
  IncomeCategory,
  LearningCategory,
  PriorityKind,
  ProjectStatus,
  ProspectSource,
  ProspectStage,
  SavingsKind,
  ThemePreference,
  WorkoutCategory,
} from "@/lib/constants";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Simplify<T> = { [K in keyof T]: T[K] } & {};

interface Relationship {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}

/** Keys that are NOT NULL and have no default must be supplied on insert. */
type TableDef<Row, RequiredOnInsert extends keyof Row, Rels extends Relationship[] = []> = {
  Row: Row;
  Insert: Simplify<Pick<Row, RequiredOnInsert> & Partial<Omit<Row, RequiredOnInsert>>>;
  Update: Simplify<Partial<Row>>;
  Relationships: Rels;
};

type Timestamps = {
  created_at: string;
  updated_at: string;
};

type Owned = {
  id: string;
  user_id: string;
};

type ProjectFk<Name extends string> = {
  foreignKeyName: Name;
  columns: ["project_id", "user_id"];
  isOneToOne: false;
  referencedRelation: "projects";
  referencedColumns: ["id", "user_id"];
};

export type ProfileRow = Owned &
  Timestamps & {
    full_name: string | null;
    avatar_url: string | null;
    onboarded_at: string | null;
  };

export type UserSettingsRow = Owned &
  Timestamps & {
    timezone: string;
    currency: string;
    daily_learning_target_minutes: number;
    weekly_workout_target: number;
    daily_outreach_target: number;
    monthly_income_goal: number;
    monthly_savings_goal: number;
    success_threshold: number;
    theme: ThemePreference;
  };

export type ChallengeRow = Owned &
  Timestamps & {
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
  };

export type DailyLogRow = Owned & Timestamps & { log_date: string; notes: string | null };

export type DailyHabitRow = Owned &
  Timestamps & {
    log_date: string;
    habit_key: HabitKey;
    completed: boolean;
    notes: string | null;
    completed_at: string | null;
  };

export type DailyPriorityRow = Owned &
  Timestamps & {
    log_date: string;
    kind: PriorityKind;
    title: string;
    completed: boolean;
    completed_at: string | null;
  };

export type ProjectRow = Owned &
  Timestamps & {
    name: string;
    client_name: string | null;
    status: ProjectStatus;
    description: string | null;
  };

export type WorkoutRow = Owned &
  Timestamps & {
    workout_date: string;
    category: WorkoutCategory;
    custom_category: string | null;
    duration_minutes: number;
    notes: string | null;
  };

export type WorkoutExerciseRow = Owned & {
  workout_id: string;
  name: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  position: number;
  created_at: string;
};

export type BodyMetricRow = Owned &
  Timestamps & {
    measured_on: string;
    body_weight_kg: number | null;
    waist_cm: number | null;
    chest_cm: number | null;
    arms_cm: number | null;
    photo_url: string | null;
    notes: string | null;
  };

export type LearningSessionRow = Owned &
  Timestamps & {
    session_date: string;
    topic: string;
    category: LearningCategory;
    duration_minutes: number;
    resource: string | null;
    notes: string | null;
    project_id: string | null;
    completed: boolean;
  };

export type ProspectRow = Owned &
  Timestamps & {
    name: string;
    company: string | null;
    source: ProspectSource;
    profile_url: string | null;
    contact_method: string | null;
    service_needed: string | null;
    estimated_value: number | null;
    stage: ProspectStage;
    contacted_on: string | null;
    replied_on: string | null;
    won_on: string | null;
    notes: string | null;
  };

export type ProspectFollowupRow = Owned &
  Timestamps & {
    prospect_id: string;
    due_on: string;
    status: FollowupStatus;
    channel: "manual" | "email" | "dm" | "call";
    notes: string | null;
    external_ref: string | null;
    completed_on: string | null;
  };

export type OutreachLogRow = Owned & {
  log_date: string;
  source: ProspectSource;
  count: number;
  notes: string | null;
  created_at: string;
};

export type WorkSessionRow = Owned &
  Timestamps & {
    project_id: string;
    session_date: string;
    task: string;
    start_time: string | null;
    end_time: string | null;
    duration_minutes: number;
    billable: boolean;
    amount_earned: number;
    notes: string | null;
  };

export type ContentItemRow = Owned &
  Timestamps & {
    platform: ContentPlatform;
    content_date: string;
    content_type: ContentType;
    title: string;
    url: string | null;
    status: ContentStatus;
    notes: string | null;
  };

export type IncomeTransactionRow = Owned &
  Timestamps & {
    txn_date: string;
    amount: number;
    source: string | null;
    client: string | null;
    project_id: string | null;
    category: IncomeCategory;
    notes: string | null;
  };

export type ExpenseTransactionRow = Owned &
  Timestamps & {
    txn_date: string;
    amount: number;
    category: ExpenseCategory;
    notes: string | null;
  };

export type SavingsEntryRow = Owned &
  Timestamps & {
    entry_date: string;
    amount: number;
    kind: SavingsKind;
    notes: string | null;
  };

export type WeeklyReviewRow = Owned &
  Timestamps & {
    week_start: string;
    built: string | null;
    learned: string | null;
    prospects_contacted: string | null;
    money_earned: string | null;
    money_saved: string | null;
    time_wasters: string | null;
    went_well: string | null;
    improve_next: string | null;
    reflection: string | null;
    stats: Json;
  };

export type JournalEntryRow = Owned &
  Timestamps & {
    entry_date: string;
    mood: number | null;
    energy: number | null;
    notes: string | null;
    gratitude: string | null;
    biggest_win: string | null;
    biggest_challenge: string | null;
  };

export type NotificationKind = "followup" | "learning" | "weekly_review" | "streak" | "savings" | "system";

export type NotificationRow = Owned & {
  dedupe_key: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export type DailyScoreRow = { user_id: string; log_date: string; score: number };

export type ActivityKind = "workout" | "learning" | "prospect" | "work" | "content" | "income" | "expense";

export type RecentActivityRow = {
  user_id: string;
  kind: ActivityKind;
  id: string;
  occurred_on: string;
  created_at: string;
  title: string;
  value: number | null;
};

/** One row per day from the daily_series() function. Numeric columns may arrive as strings. */
export type DailySeriesRow = {
  day: string;
  score: number;
  workouts: number;
  workout_minutes: number;
  learning_minutes: number;
  prospects_contacted: number;
  outreach_logged: number;
  followups_done: number;
  outreach_actions: number;
  replies: number;
  clients_won: number;
  won_value: number | string;
  work_minutes: number;
  work_earned: number | string;
  posts_published: number;
  income: number | string;
  expenses: number | string;
  savings: number | string;
};

export type SearchKind = "prospect" | "project" | "learning" | "content" | "journal";

export type SearchResultRow = {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string | null;
  occurred_on: string | null;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, never>;
      user_settings: TableDef<UserSettingsRow, never>;
      challenges: TableDef<ChallengeRow, "name" | "start_date" | "end_date">;
      daily_logs: TableDef<DailyLogRow, "log_date">;
      daily_habits: TableDef<DailyHabitRow, "log_date" | "habit_key">;
      daily_priorities: TableDef<DailyPriorityRow, "log_date" | "kind" | "title">;
      projects: TableDef<ProjectRow, "name">;
      workouts: TableDef<WorkoutRow, "workout_date" | "category">;
      workout_exercises: TableDef<
        WorkoutExerciseRow,
        "workout_id" | "name",
        [
          {
            foreignKeyName: "workout_exercises_workout_id_user_id_fkey";
            columns: ["workout_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "workouts";
            referencedColumns: ["id", "user_id"];
          },
        ]
      >;
      body_metrics: TableDef<BodyMetricRow, "measured_on">;
      learning_sessions: TableDef<
        LearningSessionRow,
        "session_date" | "topic" | "category" | "duration_minutes",
        [ProjectFk<"learning_sessions_project_id_user_id_fkey">]
      >;
      prospects: TableDef<ProspectRow, "name" | "source">;
      prospect_followups: TableDef<
        ProspectFollowupRow,
        "prospect_id" | "due_on",
        [
          {
            foreignKeyName: "prospect_followups_prospect_id_user_id_fkey";
            columns: ["prospect_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "prospects";
            referencedColumns: ["id", "user_id"];
          },
        ]
      >;
      outreach_logs: TableDef<OutreachLogRow, "log_date" | "source" | "count">;
      work_sessions: TableDef<
        WorkSessionRow,
        "project_id" | "session_date" | "task" | "duration_minutes",
        [ProjectFk<"work_sessions_project_id_user_id_fkey">]
      >;
      content_items: TableDef<ContentItemRow, "platform" | "content_date" | "content_type" | "title">;
      income_transactions: TableDef<
        IncomeTransactionRow,
        "txn_date" | "amount" | "category",
        [ProjectFk<"income_transactions_project_id_user_id_fkey">]
      >;
      expense_transactions: TableDef<ExpenseTransactionRow, "txn_date" | "amount" | "category">;
      savings_entries: TableDef<SavingsEntryRow, "entry_date" | "amount">;
      weekly_reviews: TableDef<WeeklyReviewRow, "week_start">;
      journal_entries: TableDef<JournalEntryRow, "entry_date">;
      notifications: TableDef<NotificationRow, "dedupe_key" | "kind" | "title">;
    };
    Views: {
      daily_scores: { Row: DailyScoreRow; Relationships: [] };
      recent_activity: { Row: RecentActivityRow; Relationships: [] };
    };
    Functions: {
      daily_series: { Args: { p_start: string; p_end: string }; Returns: DailySeriesRow[] };
      search_everything: { Args: { p_query: string; p_limit?: number }; Returns: SearchResultRow[] };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type TableName = keyof Database["public"]["Tables"];
export type TableInsert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
