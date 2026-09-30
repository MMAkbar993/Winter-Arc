"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { loadNotifications, markNotificationsRead, type NotificationFeed } from "@/features/notifications/actions";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL_MS = 60_000;

/** Internal notification center. Reminders are generated server-side on load. */
export function NotificationBell() {
  const pathname = usePathname();
  const [feed, setFeed] = useState<NotificationFeed>({ items: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const [loading, startLoading] = useTransition();

  const lastLoaded = useRef(0);

  const refresh = useCallback(() => {
    lastLoaded.current = Date.now();
    startLoading(async () => setFeed(await loadNotifications()));
  }, []);

  // Refresh on navigation at most once a minute; opening the panel always refreshes.
  useEffect(() => {
    if (Date.now() - lastLoaded.current > REFRESH_INTERVAL_MS) refresh();
  }, [pathname, refresh]);

  const markAll = () =>
    startLoading(async () => {
      await markNotificationsRead({});
      setFeed(await loadNotifications());
    });

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) refresh();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={feed.unread > 0 ? `Notifications, ${feed.unread} unread` : "Notifications"}
        >
          <Bell aria-hidden />
          {feed.unread > 0 ? (
            <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-4 font-semibold text-brand-foreground tabular">
              {feed.unread > 9 ? "9+" : feed.unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          <Button variant="ghost" size="sm" onClick={markAll} disabled={feed.unread === 0 || loading}>
            <CheckCheck aria-hidden /> Mark all read
          </Button>
        </div>
        {feed.items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            {loading ? "Loading…" : "You're all caught up."}
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto py-1" aria-live="polite">
            {feed.items.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href ?? "/dashboard"}
                  onClick={() => setOpen(false)}
                  className="flex gap-3 px-3 py-2.5 hover:bg-accent/60"
                >
                  <span
                    aria-hidden
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-brand")}
                  />
                  <span className="min-w-0">
                    <span className={cn("block text-sm", !n.read_at && "font-medium")}>{n.title}</span>
                    {n.body ? <span className="block text-xs text-muted-foreground">{n.body}</span> : null}
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      {!n.read_at ? <span className="sr-only"> · unread</span> : null}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
