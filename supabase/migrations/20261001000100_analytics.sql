-- =============================================================================
-- Winter Arc OS — analytics functions and views
--
-- All functions are SECURITY INVOKER: they run with the caller's privileges, so
-- RLS still applies. They additionally filter on auth.uid() so the per-user
-- indexes are used.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- daily_series: one row per calendar day with every tracked metric.
-- The backbone for dashboard KPIs, calendar, weekly reviews, challenge summary
-- and analytics — one round-trip instead of a query per metric.
-- -----------------------------------------------------------------------------
create or replace function public.daily_series(p_start date, p_end date)
returns table (
  day date,
  score integer,
  workouts integer,
  workout_minutes integer,
  learning_minutes integer,
  prospects_contacted integer,
  outreach_logged integer,
  followups_done integer,
  outreach_actions integer,
  replies integer,
  clients_won integer,
  won_value numeric,
  work_minutes integer,
  work_earned numeric,
  posts_published integer,
  income numeric,
  expenses numeric,
  savings numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;
  if p_start is null or p_end is null or p_end < p_start then
    return;
  end if;
  if p_end - p_start > 800 then
    raise exception 'date range too large' using errcode = '22023';
  end if;

  return query
  with days as (
    select gs::date as day from generate_series(p_start, p_end, interval '1 day') as gs
  ),
  h as (
    select log_date as day, (count(*) filter (where completed))::integer as score
    from public.daily_habits
    where user_id = v_uid and log_date between p_start and p_end
    group by log_date
  ),
  w as (
    select workout_date as day, count(*)::integer as n, sum(duration_minutes)::integer as minutes
    from public.workouts
    where user_id = v_uid and workout_date between p_start and p_end
    group by workout_date
  ),
  l as (
    select session_date as day, sum(duration_minutes)::integer as minutes
    from public.learning_sessions
    where user_id = v_uid and session_date between p_start and p_end
    group by session_date
  ),
  pc as (
    select contacted_on as day, count(*)::integer as n
    from public.prospects
    where user_id = v_uid and contacted_on between p_start and p_end
    group by contacted_on
  ),
  ol as (
    select log_date as day, sum(count)::integer as n
    from public.outreach_logs
    where user_id = v_uid and log_date between p_start and p_end
    group by log_date
  ),
  fd as (
    select completed_on as day, count(*)::integer as n
    from public.prospect_followups
    where user_id = v_uid and status = 'done' and completed_on between p_start and p_end
    group by completed_on
  ),
  rp as (
    select replied_on as day, count(*)::integer as n
    from public.prospects
    where user_id = v_uid and replied_on between p_start and p_end
    group by replied_on
  ),
  wn as (
    select won_on as day, count(*)::integer as n, coalesce(sum(estimated_value), 0) as value
    from public.prospects
    where user_id = v_uid and stage = 'won' and won_on between p_start and p_end
    group by won_on
  ),
  ws as (
    select session_date as day, sum(duration_minutes)::integer as minutes, sum(amount_earned) as earned
    from public.work_sessions
    where user_id = v_uid and session_date between p_start and p_end
    group by session_date
  ),
  ci as (
    select content_date as day, count(*)::integer as n
    from public.content_items
    where user_id = v_uid and status = 'published' and content_date between p_start and p_end
    group by content_date
  ),
  inc as (
    select txn_date as day, sum(amount) as amount
    from public.income_transactions
    where user_id = v_uid and txn_date between p_start and p_end
    group by txn_date
  ),
  ex as (
    select txn_date as day, sum(amount) as amount
    from public.expense_transactions
    where user_id = v_uid and txn_date between p_start and p_end
    group by txn_date
  ),
  sv as (
    select entry_date as day,
           sum(case when kind = 'withdrawal' then -amount else amount end) as amount
    from public.savings_entries
    where user_id = v_uid and entry_date between p_start and p_end
    group by entry_date
  )
  select
    d.day,
    coalesce(h.score, 0),
    coalesce(w.n, 0),
    coalesce(w.minutes, 0),
    coalesce(l.minutes, 0),
    coalesce(pc.n, 0),
    coalesce(ol.n, 0),
    coalesce(fd.n, 0),
    coalesce(pc.n, 0) + coalesce(ol.n, 0) + coalesce(fd.n, 0),
    coalesce(rp.n, 0),
    coalesce(wn.n, 0),
    coalesce(wn.value, 0),
    coalesce(ws.minutes, 0),
    coalesce(ws.earned, 0),
    coalesce(ci.n, 0),
    coalesce(inc.amount, 0),
    coalesce(ex.amount, 0),
    coalesce(sv.amount, 0)
  from days d
  left join h on h.day = d.day
  left join w on w.day = d.day
  left join l on l.day = d.day
  left join pc on pc.day = d.day
  left join ol on ol.day = d.day
  left join fd on fd.day = d.day
  left join rp on rp.day = d.day
  left join wn on wn.day = d.day
  left join ws on ws.day = d.day
  left join ci on ci.day = d.day
  left join inc on inc.day = d.day
  left join ex on ex.day = d.day
  left join sv on sv.day = d.day
  order by d.day;
end;
$$;

revoke execute on function public.daily_series(date, date) from public, anon;
grant execute on function public.daily_series(date, date) to authenticated;

-- -----------------------------------------------------------------------------
-- recent_activity: unified feed across modules (security_invoker → RLS applies)
-- -----------------------------------------------------------------------------
create view public.recent_activity
with (security_invoker = true)
as
select user_id, 'workout'::text as kind, id, workout_date as occurred_on, created_at,
       coalesce(custom_category, category) as title, duration_minutes::numeric as value
from public.workouts
union all
select user_id, 'learning', id, session_date, created_at, topic, duration_minutes::numeric
from public.learning_sessions
union all
select user_id, 'prospect', id, coalesce(contacted_on, created_at::date), created_at, name, estimated_value
from public.prospects
union all
select user_id, 'work', id, session_date, created_at, task, duration_minutes::numeric
from public.work_sessions
union all
select user_id, 'content', id, content_date, created_at, title, null::numeric
from public.content_items
union all
select user_id, 'income', id, txn_date, created_at, coalesce(source, client, category), amount
from public.income_transactions
union all
select user_id, 'expense', id, txn_date, created_at, category, amount
from public.expense_transactions;

revoke all on public.recent_activity from anon;

-- -----------------------------------------------------------------------------
-- search_everything: parameterised, LIKE-escaped global search
-- -----------------------------------------------------------------------------
create or replace function public.search_everything(p_query text, p_limit integer default 8)
returns table (kind text, id uuid, title text, subtitle text, occurred_on date)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_term text := btrim(coalesce(p_query, ''));
  v_pattern text;
  v_limit integer := least(greatest(coalesce(p_limit, 8), 1), 25);
begin
  if v_uid is null or char_length(v_term) < 2 then
    return;
  end if;
  v_pattern := '%' || replace(replace(replace(left(v_term, 100), '\', '\\'), '%', '\%'), '_', '\_') || '%';

  return query
  (select 'prospect'::text, p.id, p.name, coalesce(p.company, p.service_needed), p.contacted_on
   from public.prospects p
   where p.user_id = v_uid
     and (p.name ilike v_pattern or p.company ilike v_pattern or p.service_needed ilike v_pattern or p.notes ilike v_pattern)
   order by p.updated_at desc limit v_limit)
  union all
  (select 'project'::text, pr.id, pr.name, pr.client_name, pr.created_at::date
   from public.projects pr
   where pr.user_id = v_uid
     and (pr.name ilike v_pattern or pr.client_name ilike v_pattern or pr.description ilike v_pattern)
   order by pr.updated_at desc limit v_limit)
  union all
  (select 'learning'::text, ls.id, ls.topic, ls.resource, ls.session_date
   from public.learning_sessions ls
   where ls.user_id = v_uid
     and (ls.topic ilike v_pattern or ls.resource ilike v_pattern or ls.notes ilike v_pattern)
   order by ls.session_date desc limit v_limit)
  union all
  (select 'content'::text, c.id, c.title, c.platform, c.content_date
   from public.content_items c
   where c.user_id = v_uid and (c.title ilike v_pattern or c.notes ilike v_pattern)
   order by c.content_date desc limit v_limit)
  union all
  (select 'journal'::text, j.id, coalesce(j.biggest_win, left(j.notes, 80), 'Journal entry'),
          left(coalesce(j.notes, j.gratitude, j.biggest_challenge, ''), 120), j.entry_date
   from public.journal_entries j
   where j.user_id = v_uid
     and (j.notes ilike v_pattern or j.gratitude ilike v_pattern or j.biggest_win ilike v_pattern
          or j.biggest_challenge ilike v_pattern)
   order by j.entry_date desc limit v_limit);
end;
$$;

revoke execute on function public.search_everything(text, integer) from public, anon;
grant execute on function public.search_everything(text, integer) to authenticated;
