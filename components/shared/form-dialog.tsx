"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Dialog used for every create/edit form. Renders as a bottom sheet on phones
 * and a centered modal on larger screens.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
  wide = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  trigger?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        className={
          "max-h-[92dvh] overflow-y-auto p-5 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:pb-safe " +
          (wide ? "sm:max-w-2xl" : "sm:max-w-lg")
        }
      >
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function FormActions({
  pending,
  submitLabel = "Save",
  onCancel,
}: {
  pending: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      {onCancel ? (
        <Button type="button" variant="ghost" size="lg" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="min-w-28">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {pending ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}
