import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CircleDollarSign, FileText, MessageSquareReply, Phone, Send, Trophy, UserCheck } from "lucide-react";
import { BarList } from "@/components/charts/bar-list";
import { DeleteButton } from "@/components/shared/delete-button";
import { PageHeader } from "@/components/shared/page-header";
import { RecordList, RecordRow } from "@/components/shared/record-list";
import { Section } from "@/components/shared/section";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { deleteOutreachLog } from "@/features/clients/actions";
import { FollowupList } from "@/features/clients/components/followup-list";
import { KanbanBoard } from "@/features/clients/components/kanban-board";
import { ProspectTable } from "@/features/clients/components/prospect-table";
import { getClientsData } from "@/features/clients/queries";
import { AddButton } from "@/features/quick-add/quick-action-button";
import { labelFor, PROSPECT_SOURCES } from "@/lib/constants";
import { requireOnboardedContext } from "@/lib/data/context";
import { formatISODate } from "@/lib/dates";
import { formatCurrency, percent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Clients" };

const VIEWS = [
  { value: "pipeline", label: "Pipeline" },
  { value: "table", label: "Table" },
] as const;

export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const ctx = await requireOnboardedContext();
  const { settings, today } = ctx;
  const params = await searchParams;
  const view = params.view === "table" ? "table" : "pipeline";
  const data = await getClientsData(ctx);
  const { overview, stats } = data;
  const { currency } = settings;

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Clients"
        description={`Lightweight CRM for client acquisition. Daily target: ${settings.dailyOutreachTarget} outreach actions.`}
        actions={
          <>
            <AddButton kind="outreach" variant="outline" label="Log outreach" />
            <AddButton kind="prospect" />
          </>
        }
      />

      <StatGrid>
        <StatCard
          label="Outreach today"
          icon={Send}
          tone="brand"
          value={`${overview.today.outreachActions} / ${settings.dailyOutreachTarget}`}
          progress={percent(overview.today.outreachActions, settings.dailyOutreachTarget)}
          hint={`${data.contactedToday} prospects contacted today`}
        />
        <StatCard label="Contacted this week" icon={CalendarDays} value={overview.week.outreachActions} />
        <StatCard
          label="Replies"
          icon={MessageSquareReply}
          value={stats.replies}
          hint={`${stats.replyRate}% reply rate · ${overview.week.replies} this week`}
        />
        <StatCard label="Qualified" icon={UserCheck} value={stats.qualified} />
        <StatCard label="Calls" icon={Phone} value={stats.calls} />
        <StatCard label="Proposals" icon={FileText} value={stats.proposals} />
        <StatCard label="Clients won" icon={Trophy} value={stats.won} hint={`Won revenue ${formatCurrency(stats.wonValue, currency)}`} />
        <StatCard label="Pipeline value" icon={CircleDollarSign} value={formatCurrency(stats.pipelineValue, currency)} hint="Open prospects" />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Section id="due" title="Follow-ups" description="Due today and overdue">
          <FollowupList items={data.followups} today={today} />
        </Section>
        <Section id="sources" title="Outreach by platform" description="This week">
          <BarList items={data.bySource} emptyLabel="No outreach logged this week yet." />
        </Section>
      </div>

      <section aria-labelledby="pipeline-title" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="pipeline-title" className="text-sm font-semibold">
            Prospects <span className="font-normal text-muted-foreground">({stats.total})</span>
          </h2>
          <nav aria-label="Prospect view" className="flex rounded-lg border p-0.5">
            {VIEWS.map((v) => (
              <Link
                key={v.value}
                href={v.value === "pipeline" ? "/clients" : "/clients?view=table"}
                aria-current={view === v.value ? "page" : undefined}
                scroll={false}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  view === v.value ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v.label}
              </Link>
            ))}
          </nav>
        </div>
        {view === "pipeline" ? (
          <KanbanBoard prospects={data.prospects} today={today} currency={currency} />
        ) : (
          <div className="rounded-xl border bg-card px-4 py-1">
            <ProspectTable prospects={data.prospects} today={today} currency={currency} />
          </div>
        )}
      </section>

      <Section id="outreach-log" title="Outreach log" description="Bulk actions this week">
        {data.outreachLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing logged this week. Use “Log outreach” for buyer requests, DMs and comments you don&apos;t track individually.
          </p>
        ) : (
          <RecordList>
            {data.outreachLogs.map((log) => (
              <RecordRow
                key={log.id}
                title={`${log.count} × ${labelFor(PROSPECT_SOURCES, log.source)}`}
                meta={
                  <>
                    <span>{formatISODate(log.log_date, "EEE, MMM d")}</span>
                    {log.notes ? <span className="truncate">{log.notes}</span> : null}
                  </>
                }
                actions={<DeleteButton action={deleteOutreachLog.bind(null, log.id)} itemLabel="outreach entry" />}
              />
            ))}
          </RecordList>
        )}
      </Section>
    </div>
  );
}
