import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  Dumbbell,
  LayoutDashboard,
  Megaphone,
  NotebookPen,
  Settings,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today", icon: Sun },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/fitness", label: "Fitness", icon: Dumbbell },
  { href: "/learning", label: "Learning", icon: BookOpen },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/content", label: "Content", icon: Megaphone },
  { href: "/money", label: "Money", icon: CircleDollarSign },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/weekly-review", label: "Weekly Review", icon: ClipboardCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** The four destinations shown in the mobile bottom bar (plus quick add). */
export const MOBILE_PRIMARY = ["/dashboard", "/today", "/clients", "/learning"] as const;

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
