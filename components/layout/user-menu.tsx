import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { initials } from "@/lib/format";

/** Profile block + logout pinned to the bottom of the sidebar. */
export function UserMenu({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-background/40 p-2">
      <Avatar className="size-9">
        <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand">{initials(name)}</AvatarFallback>
      </Avatar>
      <Link href="/settings" className="min-w-0 flex-1 rounded-md">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </Link>
      <Button asChild variant="ghost" size="icon-sm" aria-label="Settings">
        <Link href="/settings">
          <Settings aria-hidden />
        </Link>
      </Button>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon-sm" aria-label="Log out">
          <LogOut aria-hidden />
        </Button>
      </form>
    </div>
  );
}
