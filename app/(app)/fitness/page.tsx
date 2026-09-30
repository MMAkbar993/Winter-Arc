import type { Metadata } from "next";
import { Activity, CalendarRange, Dumbbell, Flame, Ruler, Scale, Target } from "lucide-react";
import { BarList } from "@/components/charts/bar-list";
import { LineSeriesChart } from "@/components/charts/lazy-charts";
import { DeleteButton } from "@/components/shared/delete-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RecordList, RecordRow } from "@/components/shared/record-list";
import { Section } from "@/components/shared/section";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { deleteBodyMetric, deleteWorkout } from "@/features/fitness/actions";
import { getFitnessData } from "@/features/fitness/queries";
import { EditRecordButton } from "@/features/quick-add/edit-record-button";
import { AddButton } from "@/features/quick-add/quick-action-button";
import { labelFor, WORKOUT_CATEGORIES } from "@/lib/constants";
import { requireOnboardedContext } from "@/lib/data/context";
import { formatISODate } from "@/lib/dates";
import { formatMinutes, formatNumber, percent, pluralize } from "@/lib/format";
import { str } from "@/lib/options";

export const metadata: Metadata = { title: "Fitness" };

export default async function FitnessPage() {
  const ctx = await requireOnboardedContext();
  const { settings } = ctx;
  const data = await getFitnessData(ctx);
  const { overview } = data;
  const weights = data.metrics.filter((m) => m.body_weight_kg !== null);
  const latestWeight = weights.at(-1);
  const firstWeight = weights[0];

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Fitness"
        description={`Target: ${settings.weeklyWorkoutTarget} workouts a week. Another day, another rep.`}
        actions={
          <>
            <AddButton kind="body" variant="outline" label="Measurements" />
            <AddButton kind="workout" />
          </>
        }
      />

      <StatGrid>
        <StatCard
          label="This week"
          icon={Target}
          tone="brand"
          value={`${overview.week.workouts} / ${settings.weeklyWorkoutTarget}`}
          progress={percent(overview.week.workouts, settings.weeklyWorkoutTarget)}
          hint="Weekly target progress"
        />
        <StatCard label="This month" icon={CalendarRange} value={pluralize(overview.month.workouts, "workout")} />
        <StatCard
          label="Workout streak"
          icon={Flame}
          value={pluralize(data.streak.current, "day")}
          hint={`Longest ${pluralize(data.streak.longest, "day")}`}
        />
        <StatCard label="Total sessions" icon={Dumbbell} value={formatNumber(data.totalSessions)} hint={`${overview.challenge.workouts} this challenge`} />
        <StatCard label="Most trained" icon={Activity} value={data.mostTrained ?? "—"} />
        <StatCard
          label="Body weight"
          icon={Scale}
          value={latestWeight ? `${formatNumber(Number(latestWeight.body_weight_kg), 1)} kg` : "—"}
          hint={
            latestWeight && firstWeight && latestWeight.id !== firstWeight.id
              ? `${Number(latestWeight.body_weight_kg) - Number(firstWeight.body_weight_kg) >= 0 ? "+" : ""}${formatNumber(Number(latestWeight.body_weight_kg) - Number(firstWeight.body_weight_kg), 1)} kg since ${formatISODate(firstWeight.measured_on, "MMM d")}`
              : "Log measurements to track"
          }
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Section id="weight" title="Body weight" description="kg over time">
          {weights.length >= 2 ? (
            <LineSeriesChart
              data={weights.map((m) => ({ day: m.measured_on, weight: Number(m.body_weight_kg) }))}
              xKey="day"
              yKey="weight"
              formatX="date"
              label={`Body weight over time, from ${formatNumber(Number(firstWeight?.body_weight_kg), 1)} to ${formatNumber(Number(latestWeight?.body_weight_kg), 1)} kg`}
            />
          ) : (
            <EmptyState
              compact
              icon={Scale}
              title="Not enough data yet"
              description="Log your body weight at least twice to see the trend."
              action={<AddButton kind="body" variant="outline" label="Log measurements" />}
            />
          )}
        </Section>
        <Section id="split" title="Training split" description="Sessions this challenge">
          <BarList items={data.byCategory} format={(v) => pluralize(v, "session")} emptyLabel="No workouts in this challenge yet." />
        </Section>
      </div>

      <Section id="workouts" title="Workouts">
        {data.workouts.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No workouts yet."
            description="Log your first session to start your Winter Arc fitness streak."
            action={<AddButton kind="workout" label="Log your first workout" />}
          />
        ) : (
          <RecordList>
            {data.workouts.map((w) => (
              <RecordRow
                key={w.id}
                title={w.custom_category ?? labelFor(WORKOUT_CATEGORIES, w.category)}
                meta={
                  <>
                    <span>{formatISODate(w.workout_date, "EEE, MMM d")}</span>
                    {w.workout_exercises.length > 0 ? (
                      <span className="truncate">
                        {w.workout_exercises
                          .slice(0, 4)
                          .map((e) => `${e.name}${e.sets && e.reps ? ` ${e.sets}×${e.reps}` : ""}${e.weight_kg ? ` @${formatNumber(Number(e.weight_kg), 1)}kg` : ""}`)
                          .join(" · ")}
                        {w.workout_exercises.length > 4 ? ` +${w.workout_exercises.length - 4}` : ""}
                      </span>
                    ) : null}
                  </>
                }
                value={formatMinutes(w.duration_minutes)}
                actions={
                  <>
                    <EditRecordButton
                      kind="workout"
                      id={w.id}
                      title="Edit workout"
                      initial={{
                        date: w.workout_date,
                        category: w.category,
                        customCategory: str(w.custom_category),
                        duration: str(w.duration_minutes),
                        notes: str(w.notes),
                        exercises: w.workout_exercises.map((e) => ({
                          name: e.name,
                          sets: str(e.sets),
                          reps: str(e.reps),
                          weight: str(e.weight_kg),
                        })),
                      }}
                    />
                    <DeleteButton action={deleteWorkout.bind(null, w.id)} itemLabel="workout" />
                  </>
                }
              />
            ))}
          </RecordList>
        )}
      </Section>

      <Section id="metrics" title="Body measurements" description="Progress photos are private to your account.">
        {data.metrics.length === 0 ? (
          <EmptyState
            compact
            icon={Ruler}
            title="No measurements yet"
            description="Weight, waist, chest and arms — track what matters to you."
          />
        ) : (
          <RecordList>
            {[...data.metrics].reverse().slice(0, 30).map((m) => (
              <RecordRow
                key={m.id}
                title={formatISODate(m.measured_on, "EEE, MMM d, yyyy")}
                meta={
                  <>
                    {m.waist_cm ? <span>Waist {formatNumber(Number(m.waist_cm), 1)}cm</span> : null}
                    {m.chest_cm ? <span>Chest {formatNumber(Number(m.chest_cm), 1)}cm</span> : null}
                    {m.arms_cm ? <span>Arms {formatNumber(Number(m.arms_cm), 1)}cm</span> : null}
                    {m.photo_url ? (
                      <a href={m.photo_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                        Photo
                      </a>
                    ) : null}
                    {m.notes ? <Badge variant="secondary">Note</Badge> : null}
                  </>
                }
                value={m.body_weight_kg ? `${formatNumber(Number(m.body_weight_kg), 1)} kg` : null}
                actions={
                  <>
                    <EditRecordButton
                      kind="body"
                      id={m.id}
                      title="Edit measurements"
                      initial={{
                        date: m.measured_on,
                        bodyWeight: str(m.body_weight_kg),
                        waist: str(m.waist_cm),
                        chest: str(m.chest_cm),
                        arms: str(m.arms_cm),
                        photoUrl: str(m.photo_url),
                        notes: str(m.notes),
                      }}
                    />
                    <DeleteButton action={deleteBodyMetric.bind(null, m.id)} itemLabel="measurement" />
                  </>
                }
              />
            ))}
          </RecordList>
        )}
      </Section>
    </div>
  );
}
