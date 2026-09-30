import type { Metadata } from "next";
import { CalendarRange, ExternalLink, Flame, Lightbulb, Megaphone, Send } from "lucide-react";
import { BarList } from "@/components/charts/bar-list";
import { DeleteButton } from "@/components/shared/delete-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RecordList, RecordRow } from "@/components/shared/record-list";
import { Section } from "@/components/shared/section";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteContentItem } from "@/features/content/actions";
import { getOverview } from "@/features/dashboard/overview";
import { EditRecordButton } from "@/features/quick-add/edit-record-button";
import { AddButton } from "@/features/quick-add/quick-action-button";
import {
  CONTENT_PLATFORMS,
  CONTENT_STATUSES,
  CONTENT_TYPES,
  labelFor,
  type ContentPlatform,
} from "@/lib/constants";
import { requireOnboardedContext } from "@/lib/data/context";
import { formatISODate } from "@/lib/dates";
import { pluralize } from "@/lib/format";
import { str } from "@/lib/options";
import { calculateActivityStreak } from "@/lib/scoring";
import type { ContentItemRow } from "@/types/database";

export const metadata: Metadata = { title: "Content" };

function ContentRow({ item }: { item: ContentItemRow }) {
  return (
    <RecordRow
      title={item.title}
      meta={
        <>
          <span>{formatISODate(item.content_date, "EEE, MMM d")}</span>
          <Badge variant="outline">{labelFor(CONTENT_PLATFORMS, item.platform)}</Badge>
          <span>{labelFor(CONTENT_TYPES, item.content_type)}</span>
          {item.status !== "published" ? <Badge variant="secondary">{labelFor(CONTENT_STATUSES, item.status)}</Badge> : null}
        </>
      }
      actions={
        <>
          {item.url ? (
            <Button asChild variant="ghost" size="icon-sm" aria-label="Open post">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden />
              </a>
            </Button>
          ) : null}
          <EditRecordButton
            kind="content"
            id={item.id}
            title="Edit content"
            initial={{
              platform: item.platform,
              date: item.content_date,
              contentType: item.content_type,
              title: item.title,
              url: str(item.url),
              status: item.status,
              notes: str(item.notes),
            }}
          />
          <DeleteButton action={deleteContentItem.bind(null, item.id)} itemLabel="content" />
        </>
      }
    />
  );
}

export default async function ContentPage() {
  const ctx = await requireOnboardedContext();
  const { supabase, user, today } = ctx;
  const [overview, itemsRes] = await Promise.all([
    getOverview(ctx),
    supabase
      .from("content_items")
      .select("*")
      .eq("user_id", user.id)
      .order("content_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300),
  ]);
  if (itemsRes.error) throw new Error("Could not load content.");
  const items = itemsRes.data;
  const published = items.filter((i) => i.status === "published");
  const pipeline = items.filter((i) => i.status !== "published");
  const streak = calculateActivityStreak(new Set(published.map((p) => p.content_date)), today);

  const platformCounts = new Map<ContentPlatform, number>();
  for (const p of published) {
    if (p.content_date >= overview.monthStart) platformCounts.set(p.platform, (platformCounts.get(p.platform) ?? 0) + 1);
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader title="Content" description="Build in public. Publishing one piece ticks the Content habit." actions={<AddButton kind="content" />} />

      <StatGrid>
        <StatCard label="Posted this week" icon={Send} tone="brand" value={overview.week.postsPublished} />
        <StatCard label="Posts this month" icon={CalendarRange} value={overview.month.postsPublished} />
        <StatCard label="Publishing streak" icon={Flame} value={pluralize(streak.current, "day")} hint={`Longest ${pluralize(streak.longest, "day")}`} />
        <StatCard label="In the pipeline" icon={Lightbulb} value={pipeline.length} hint="Ideas, drafts and scheduled" />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Section id="platforms" title="Platform breakdown" description="Published this month">
          <BarList
            items={[...platformCounts.entries()]
              .map(([platform, value]) => ({ label: labelFor(CONTENT_PLATFORMS, platform), value }))
              .sort((a, b) => b.value - a.value)}
            format={(v) => pluralize(v, "post")}
            emptyLabel="Nothing published this month yet."
          />
        </Section>
        <Section id="pipeline" title="Pipeline" description="Ideas, drafts and scheduled posts">
          {pipeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">Capture ideas as they come — save them with status “Idea”.</p>
          ) : (
            <RecordList>
              {pipeline.slice(0, 20).map((item) => (
                <ContentRow key={item.id} item={item} />
              ))}
            </RecordList>
          )}
        </Section>
      </div>

      <Section id="published" title="Published">
        {published.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Nothing published yet"
            description="Log your first build-in-public post — one per day keeps the Content habit alive."
            action={<AddButton kind="content" label="Add your first post" />}
          />
        ) : (
          <RecordList>
            {published.map((item) => (
              <ContentRow key={item.id} item={item} />
            ))}
          </RecordList>
        )}
      </Section>
    </div>
  );
}
