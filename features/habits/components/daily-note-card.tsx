"use client";

import Link from "next/link";
import { useState } from "react";
import { NotebookPen, StickyNote } from "lucide-react";
import { FormDialog } from "@/components/shared/form-dialog";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { DailyNoteForm } from "@/features/habits/components/daily-note-form";

export function DailyNoteCard({ date, note }: { date: string; note: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <Section
      id="note"
      title="Daily note"
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href="/journal">
            <NotebookPen aria-hidden /> Journal
          </Link>
        </Button>
      }
    >
      {note ? (
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{note}</p>
      ) : (
        <p className="text-sm text-muted-foreground">No note yet. Capture a thought, a win, or what to fix tomorrow.</p>
      )}
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Daily note"
        trigger={
          <Button variant="outline" className="mt-3 h-10">
            <StickyNote aria-hidden /> {note ? "Edit note" : "Add note"}
          </Button>
        }
      >
        {open ? <DailyNoteForm date={date} initialNote={note ?? ""} onDone={() => setOpen(false)} /> : null}
      </FormDialog>
    </Section>
  );
}
