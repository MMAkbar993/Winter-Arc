import {
  BookOpen,
  Briefcase,
  CircleDollarSign,
  Dumbbell,
  FolderPlus,
  Megaphone,
  NotebookPen,
  PiggyBank,
  Receipt,
  Ruler,
  Send,
  StickyNote,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export type QuickAddKind =
  | "workout"
  | "body"
  | "learning"
  | "outreach"
  | "prospect"
  | "work"
  | "project"
  | "content"
  | "income"
  | "expense"
  | "savings"
  | "journal"
  | "note";

export const QUICK_ADD: Record<QuickAddKind, { label: string; title: string; description?: string; icon: LucideIcon }> = {
  workout: { label: "Log Workout", title: "Log workout", description: "Ticks today's Workout habit.", icon: Dumbbell },
  body: { label: "Log Measurements", title: "Body measurements", icon: Ruler },
  learning: {
    label: "Log Learning",
    title: "Log learning session",
    description: "Learning completes automatically once you hit your daily target.",
    icon: BookOpen,
  },
  outreach: { label: "Add Outreach", title: "Log outreach", icon: Send },
  prospect: { label: "Add Prospect", title: "Add prospect", icon: UserPlus },
  work: { label: "Log Work Session", title: "Log work session", description: "Ticks today's Client Work habit.", icon: Briefcase },
  project: { label: "New Project", title: "New project", icon: FolderPlus },
  content: { label: "Add Content", title: "Add content", description: "Published content ticks the Content habit.", icon: Megaphone },
  income: { label: "Add Income", title: "Add income", icon: CircleDollarSign },
  expense: { label: "Add Expense", title: "Add expense", icon: Receipt },
  savings: { label: "Add Savings", title: "Record savings", icon: PiggyBank },
  journal: { label: "Write Journal", title: "Journal entry", description: "One entry per day.", icon: NotebookPen },
  note: { label: "Add Note", title: "Daily note", icon: StickyNote },
};

/** The eight quick actions shown on the Today page. */
export const TODAY_QUICK_ACTIONS: QuickAddKind[] = [
  "workout",
  "learning",
  "outreach",
  "work",
  "content",
  "income",
  "expense",
  "note",
];
