import type { Metadata } from "next";
import { Briefcase, CalendarRange, CircleDollarSign, Clock, FolderKanban, Timer } from "lucide-react";
import { DeleteButton } from "@/components/shared/delete-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RecordList, RecordRow } from "@/components/shared/record-list";
import { Section } from "@/components/shared/section";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { deleteProject, deleteWorkSession } from "@/features/projects/actions";
import { getProjectsData } from "@/features/projects/queries";
import { EditRecordButton } from "@/features/quick-add/edit-record-button";
import { AddButton } from "@/features/quick-add/quick-action-button";
import { labelFor, PROJECT_STATUSES, type ProjectStatus } from "@/lib/constants";
import { requireOnboardedContext } from "@/lib/data/context";
import { formatISODate } from "@/lib/dates";
import { formatCurrency, formatMinutes, minutesToHours } from "@/lib/format";
import { str } from "@/lib/options";

export const metadata: Metadata = { title: "Projects" };

const STATUS_VARIANT: Record<ProjectStatus, "brand" | "secondary" | "outline"> = {
  active: "brand",
  waiting: "secondary",
  completed: "outline",
  archived: "outline",
};

export default async function ProjectsPage() {
  const ctx = await requireOnboardedContext();
  const { currency } = ctx.settings;
  const data = await getProjectsData(ctx);
  const { overview } = data;

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Projects"
        description="Client and project work. Deep work compounds into revenue."
        actions={
          <>
            <AddButton kind="project" variant="outline" label="New project" />
            <AddButton kind="work" />
          </>
        }
      />

      <StatGrid>
        <StatCard label="Focused today" icon={Timer} tone="brand" value={formatMinutes(overview.today.workMinutes)} />
        <StatCard label="This week" icon={CalendarRange} value={`${minutesToHours(overview.week.workMinutes)}h`} />
        <StatCard label="This month" icon={Clock} value={`${minutesToHours(overview.month.workMinutes)}h`} />
        <StatCard
          label="Revenue generated"
          icon={CircleDollarSign}
          value={formatCurrency(overview.month.workEarned, currency)}
          hint={`This month · ${formatCurrency(data.totalEarned, currency)} all time`}
        />
        <StatCard
          label="Most active project"
          icon={FolderKanban}
          value={data.mostActive?.name ?? "—"}
          hint={data.mostActive ? `${formatMinutes(data.mostActive.minutes)} this month` : undefined}
        />
      </StatGrid>

      <Section id="projects" title="Projects">
        {data.projects.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No projects yet"
            description="Create a project for each client engagement, then log work sessions against it."
            action={<AddButton kind="project" label="Create your first project" />}
          />
        ) : (
          <RecordList>
            {data.projects.map((p) => (
              <RecordRow
                key={p.id}
                title={p.name}
                meta={
                  <>
                    <Badge variant={STATUS_VARIANT[p.status]}>{labelFor(PROJECT_STATUSES, p.status)}</Badge>
                    {p.client_name ? <span>{p.client_name}</span> : null}
                    <span>
                      {formatMinutes(p.minutes)} · {p.sessions} sessions
                    </span>
                  </>
                }
                value={p.earned > 0 ? formatCurrency(p.earned, currency) : null}
                actions={
                  <>
                    <EditRecordButton
                      kind="project"
                      id={p.id}
                      title="Edit project"
                      initial={{ name: p.name, clientName: str(p.client_name), status: p.status, description: str(p.description) }}
                    />
                    <DeleteButton
                      action={deleteProject.bind(null, p.id)}
                      itemLabel={p.name}
                      description="This also deletes all work sessions logged for this project. Linked income and learning entries are kept."
                    />
                  </>
                }
              />
            ))}
          </RecordList>
        )}
      </Section>

      <Section id="sessions" title="Work sessions">
        {data.sessions.length === 0 ? (
          <EmptyState
            compact
            icon={Timer}
            title="No work sessions yet"
            description="Log focused client work to complete today's Client Work habit."
          />
        ) : (
          <RecordList>
            {data.sessions.map((s) => (
              <RecordRow
                key={s.id}
                title={s.task}
                meta={
                  <>
                    <span>{formatISODate(s.session_date, "EEE, MMM d")}</span>
                    {s.projects?.name ? <span>{s.projects.name}</span> : null}
                    {s.start_time && s.end_time ? (
                      <span className="tabular">
                        {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                      </span>
                    ) : null}
                    <span>{formatMinutes(s.duration_minutes)}</span>
                    {!s.billable ? <Badge variant="outline">Non-billable</Badge> : null}
                  </>
                }
                value={Number(s.amount_earned) > 0 ? formatCurrency(Number(s.amount_earned), currency) : null}
                actions={
                  <>
                    <EditRecordButton
                      kind="work"
                      id={s.id}
                      title="Edit work session"
                      initial={{
                        projectId: s.project_id,
                        date: s.session_date,
                        task: s.task,
                        startTime: s.start_time?.slice(0, 5) ?? "",
                        endTime: s.end_time?.slice(0, 5) ?? "",
                        duration: str(s.duration_minutes),
                        billable: s.billable,
                        amountEarned: Number(s.amount_earned) > 0 ? str(s.amount_earned) : "",
                        notes: str(s.notes),
                      }}
                    />
                    <DeleteButton action={deleteWorkSession.bind(null, s.id)} itemLabel="work session" />
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
