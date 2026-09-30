"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/types/actions";

/** Confirmed delete that calls a (bound) server action. */
export function DeleteButton({
  action,
  itemLabel,
  description,
  size = "icon-sm",
}: {
  action: () => Promise<ActionResult<unknown>>;
  itemLabel: string;
  description?: string;
  size?: "icon-sm" | "sm";
}) {
  const [pending, startTransition] = useTransition();

  const onConfirm = () =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(`Deleted ${itemLabel}`);
      else toast.error(result.error);
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size={size} aria-label={`Delete ${itemLabel}`} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
          {size === "sm" ? "Delete" : null}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {itemLabel}?</AlertDialogTitle>
          <AlertDialogDescription>{description ?? "This can't be undone."}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
