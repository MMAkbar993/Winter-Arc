-- =============================================================================
-- Winter Arc OS — initial schema
--
-- Conventions
--   * Every user-owned table has `user_id uuid not null references auth.users`.
--     It defaults to auth.uid() and RLS guarantees it always equals auth.uid().
--   * Child tables reference their parent through a composite foreign key
--     (parent_id, user_id) -> parent(id, user_id). This makes it impossible, at
--     the database level, to attach a row to another user's parent record.
--   * "Calendar" dates are stored as `date` in the user's own timezone (the app
--     computes the local date server-side). Instants are `timestamptz`.
--   * Enumerations use text + CHECK constraints (easy to evolve, mirrored in
--     lib/constants.ts).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  avatar_url text check (char_length(avatar_url) <= 2048),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- user_settings
-- -----------------------------------------------------------------------------
create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  timezone text not null default 'Asia/Karachi' check (char_length(timezone) between 1 and 64),
  currency text not null default 'PKR' check (currency ~ '^[A-Z]{3}$'),
  daily_learning_target_minutes integer not null default 120 check (daily_learning_target_minutes between 0 and 1440),
  weekly_workout_target integer not null default 5 check (weekly_workout_target between 0 and 14),
  daily_outreach_target integer not null default 15 check (daily_outreach_target between 0 and 500),
  monthly_income_goal numeric(14, 2) not null default 0 check (monthly_income_goal >= 0),
  monthly_savings_goal numeric(14, 2) not null default 0 check (monthly_savings_goal >= 0),
  success_threshold integer not null default 5 check (success_threshold between 1 and 7),
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- challenges
-- -----------------------------------------------------------------------------
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenges_date_range check (end_date > start_date and end_date - start_date <= 730)
);
create unique index challenges_one_active_per_user on public.challenges (user_id) where is_active;
create index challenges_user_id_idx on public.challenges (user_id);

-- -----------------------------------------------------------------------------
-- daily_logs (one row per user per local day; holds the free-form daily note)
-- -----------------------------------------------------------------------------
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date date not null,
  notes text check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

-- -----------------------------------------------------------------------------
-- daily_habits (the Daily Seven)
-- -----------------------------------------------------------------------------
create table public.daily_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date date not null,
  habit_key text not null check (habit_key in (
    'workout', 'learning', 'outreach', 'client_work', 'content', 'screen_time', 'sleep'
  )),
  completed boolean not null default false,
  notes text check (char_length(notes) <= 1000),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date, habit_key)
);
create index daily_habits_user_date_idx on public.daily_habits (user_id, log_date);

-- -----------------------------------------------------------------------------
-- daily_priorities (Today's Top 3)
-- -----------------------------------------------------------------------------
create table public.daily_priorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date date not null,
  kind text not null check (kind in ('income', 'skill', 'health')),
  title text not null check (char_length(title) between 1 and 200),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date, kind)
);
create index daily_priorities_user_date_idx on public.daily_priorities (user_id, log_date);

-- -----------------------------------------------------------------------------
-- projects (declared early: several tables reference it)
-- -----------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  client_name text check (char_length(client_name) <= 120),
  status text not null default 'active' check (status in ('active', 'waiting', 'completed', 'archived')),
  description text check (char_length(description) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index projects_user_status_idx on public.projects (user_id, status);

-- -----------------------------------------------------------------------------
-- Fitness
-- -----------------------------------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workout_date date not null,
  category text not null check (category in (
    'chest_triceps', 'back_biceps', 'legs', 'shoulders_abs', 'upper_body',
    'walking', 'sport', 'cardio', 'custom'
  )),
  custom_category text check (char_length(custom_category) <= 60),
  duration_minutes integer not null default 0 check (duration_minutes between 0 and 1440),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index workouts_user_date_idx on public.workouts (user_id, workout_date);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workout_id uuid not null,
  name text not null check (char_length(name) between 1 and 80),
  sets integer check (sets between 0 and 100),
  reps integer check (reps between 0 and 1000),
  weight_kg numeric(7, 2) check (weight_kg >= 0),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  foreign key (workout_id, user_id) references public.workouts (id, user_id) on delete cascade
);
create index workout_exercises_workout_idx on public.workout_exercises (workout_id);
create index workout_exercises_user_idx on public.workout_exercises (user_id);

create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null,
  body_weight_kg numeric(6, 2) check (body_weight_kg > 0 and body_weight_kg < 500),
  waist_cm numeric(6, 2) check (waist_cm > 0 and waist_cm < 300),
  chest_cm numeric(6, 2) check (chest_cm > 0 and chest_cm < 300),
  arms_cm numeric(6, 2) check (arms_cm > 0 and arms_cm < 150),
  photo_url text check (char_length(photo_url) <= 2048),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index body_metrics_user_date_idx on public.body_metrics (user_id, measured_on);

-- -----------------------------------------------------------------------------
-- Learning
-- -----------------------------------------------------------------------------
create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_date date not null,
  topic text not null check (char_length(topic) between 1 and 160),
  category text not null check (category in (
    'javascript', 'typescript', 'react', 'nextjs', 'nodejs', 'postgresql', 'supabase',
    'apis', 'ai', 'system_design', 'devops', 'security', 'git', 'other'
  )),
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  resource text check (char_length(resource) <= 300),
  notes text check (char_length(notes) <= 2000),
  project_id uuid,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id)
);
create index learning_sessions_user_date_idx on public.learning_sessions (user_id, session_date);

-- -----------------------------------------------------------------------------
-- Client acquisition
-- -----------------------------------------------------------------------------
create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  company text check (char_length(company) <= 120),
  source text not null check (source in (
    'fiverr', 'linkedin', 'facebook', 'x', 'email', 'referral', 'upwork', 'website', 'other'
  )),
  profile_url text check (char_length(profile_url) <= 2048),
  contact_method text check (char_length(contact_method) <= 120),
  service_needed text check (char_length(service_needed) <= 200),
  estimated_value numeric(14, 2) check (estimated_value >= 0),
  stage text not null default 'identified' check (stage in (
    'identified', 'contacted', 'replied', 'qualified', 'call_scheduled',
    'proposal_sent', 'negotiating', 'won', 'lost'
  )),
  contacted_on date,
  replied_on date,
  won_on date,
  notes text check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index prospects_user_stage_idx on public.prospects (user_id, stage);
create index prospects_user_contacted_idx on public.prospects (user_id, contacted_on);
create index prospects_user_created_idx on public.prospects (user_id, created_at);

-- Follow-ups are internal reminders. `channel` and `external_ref` exist so an
-- email/DM integration can later attach delivery state without a schema rewrite.
create table public.prospect_followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prospect_id uuid not null,
  due_on date not null,
  status text not null default 'pending' check (status in ('pending', 'done', 'skipped')),
  channel text not null default 'manual' check (channel in ('manual', 'email', 'dm', 'call')),
  notes text check (char_length(notes) <= 2000),
  external_ref text check (char_length(external_ref) <= 200),
  completed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (prospect_id, user_id) references public.prospects (id, user_id) on delete cascade
);
create index prospect_followups_user_status_due_idx on public.prospect_followups (user_id, status, due_on);
create index prospect_followups_prospect_idx on public.prospect_followups (prospect_id);

-- Bulk outreach actions not worth tracking as individual prospects
-- (e.g. "sent 8 Fiverr buyer requests").
create table public.outreach_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date date not null,
  source text not null check (source in (
    'fiverr', 'linkedin', 'facebook', 'x', 'email', 'referral', 'upwork', 'website', 'other'
  )),
  count integer not null check (count between 1 and 500),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);
create index outreach_logs_user_date_idx on public.outreach_logs (user_id, log_date);

-- -----------------------------------------------------------------------------
-- Paid work
-- -----------------------------------------------------------------------------
create table public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null,
  session_date date not null,
  task text not null check (char_length(task) between 1 and 200),
  start_time time,
  end_time time,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  billable boolean not null default true,
  amount_earned numeric(14, 2) not null default 0 check (amount_earned >= 0),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete cascade
);
create index work_sessions_user_date_idx on public.work_sessions (user_id, session_date);
create index work_sessions_project_idx on public.work_sessions (project_id);

-- -----------------------------------------------------------------------------
-- Content
-- -----------------------------------------------------------------------------
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  platform text not null check (platform in ('instagram', 'x', 'facebook', 'linkedin', 'tiktok', 'other')),
  content_date date not null,
  content_type text not null check (content_type in (
    'build_in_public', 'coding_tip', 'client_result', 'case_study', 'productivity',
    'portfolio', 'personal_insight', 'short_video', 'other'
  )),
  title text not null check (char_length(title) between 1 and 300),
  url text check (char_length(url) <= 2048),
  status text not null default 'published' check (status in ('idea', 'draft', 'scheduled', 'published')),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_items_user_date_idx on public.content_items (user_id, content_date);
create index content_items_user_status_idx on public.content_items (user_id, status);

-- -----------------------------------------------------------------------------
-- Money
-- -----------------------------------------------------------------------------
create table public.income_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  txn_date date not null,
  amount numeric(14, 2) not null check (amount > 0),
  source text check (char_length(source) <= 120),
  client text check (char_length(client) <= 120),
  project_id uuid,
  category text not null check (category in ('fiverr', 'direct_client', 'freelance', 'salary', 'referral', 'other')),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id)
);
create index income_transactions_user_date_idx on public.income_transactions (user_id, txn_date);

create table public.expense_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  txn_date date not null,
  amount numeric(14, 2) not null check (amount > 0),
  category text not null check (category in (
    'essential', 'business', 'education', 'family', 'personal', 'entertainment', 'other'
  )),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index expense_transactions_user_date_idx on public.expense_transactions (user_id, txn_date);

create table public.savings_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  amount numeric(14, 2) not null check (amount > 0),
  kind text not null default 'deposit' check (kind in ('deposit', 'withdrawal')),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index savings_entries_user_date_idx on public.savings_entries (user_id, entry_date);

-- -----------------------------------------------------------------------------
-- Reflection
-- -----------------------------------------------------------------------------
create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,
  built text check (char_length(built) <= 5000),
  learned text check (char_length(learned) <= 5000),
  prospects_contacted text check (char_length(prospects_contacted) <= 2000),
  money_earned text check (char_length(money_earned) <= 2000),
  money_saved text check (char_length(money_saved) <= 2000),
  time_wasters text check (char_length(time_wasters) <= 5000),
  went_well text check (char_length(went_well) <= 5000),
  improve_next text check (char_length(improve_next) <= 5000),
  reflection text check (char_length(reflection) <= 10000),
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  mood smallint check (mood between 1 and 5),
  energy smallint check (energy between 1 and 5),
  notes text check (char_length(notes) <= 10000),
  gratitude text check (char_length(gratitude) <= 2000),
  biggest_win text check (char_length(biggest_win) <= 2000),
  biggest_challenge text check (char_length(biggest_challenge) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

-- -----------------------------------------------------------------------------
-- Notifications (internal only). `dedupe_key` lets the app upsert generated
-- reminders idempotently, e.g. 'followups:2026-10-05'.
-- -----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 120),
  kind text not null check (kind in ('followup', 'learning', 'weekly_review', 'streak', 'savings', 'system')),
  title text not null check (char_length(title) between 1 and 200),
  body text check (char_length(body) <= 1000),
  href text check (href ~ '^/[A-Za-z0-9/_?=&.-]*$'),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'user_settings', 'challenges', 'daily_logs', 'daily_habits', 'daily_priorities',
    'projects', 'workouts', 'body_metrics', 'learning_sessions', 'prospects', 'prospect_followups',
    'work_sessions', 'content_items', 'income_transactions', 'expense_transactions',
    'savings_entries', 'weekly_reviews', 'journal_entries'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security: every table, four explicit owner-only policies.
-- `(select auth.uid())` is evaluated once per statement (Supabase perf guidance).
-- The anon role receives no policies at all, so it can read/write nothing.
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'user_settings', 'challenges', 'daily_logs', 'daily_habits', 'daily_priorities',
    'projects', 'workouts', 'workout_exercises', 'body_metrics', 'learning_sessions', 'prospects',
    'prospect_followups', 'outreach_logs', 'work_sessions', 'content_items', 'income_transactions',
    'expense_transactions', 'savings_entries', 'weekly_reviews', 'journal_entries', 'notifications'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "%1$s_select_own" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)',
      t
    );
    execute format(
      'create policy "%1$s_insert_own" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t
    );
    execute format(
      'create policy "%1$s_update_own" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t
    );
    execute format(
      'create policy "%1$s_delete_own" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)',
      t
    );
    execute format('revoke all on public.%I from anon', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- daily_scores view — security_invoker so the caller's RLS applies.
-- -----------------------------------------------------------------------------
create view public.daily_scores
with (security_invoker = true)
as
select
  user_id,
  log_date,
  count(*) filter (where completed)::integer as score
from public.daily_habits
group by user_id, log_date;

revoke all on public.daily_scores from anon;

-- -----------------------------------------------------------------------------
-- New user bootstrap: create profile + settings rows.
-- security definer is required because it runs as the auth trigger; the
-- function body only ever touches the new user's own id.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120), ''))
  on conflict (user_id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
