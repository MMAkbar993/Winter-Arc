import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { TAGLINE } from "@/lib/constants";

export function AppSidebar({ name, email }: { name: string; email: string }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
      <div className="px-5 pt-5 pb-4">
        <Link href="/dashboard" className="block w-fit rounded-md">
          <Logo />
        </Link>
        <p className="mt-1.5 text-[11px] text-muted-foreground">{TAGLINE}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        <SidebarNav />
      </div>
      <div className="p-3">
        <UserMenu name={name} email={email} />
      </div>
    </aside>
  );
}
