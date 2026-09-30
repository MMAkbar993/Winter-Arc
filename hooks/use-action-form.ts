"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues, type FieldValues, type Path } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import type { ActionResult } from "@/types/actions";

interface UseActionFormOptions<TIn extends FieldValues, TOut, R> {
  schema: z.ZodType<TOut, TIn>;
  /** Server action. Receives the RAW form values and re-validates them server-side. */
  action: (raw: TIn) => Promise<ActionResult<R>>;
  defaultValues: DefaultValues<TIn>;
  successMessage?: string;
  onSuccess?: (data: R) => void;
  resetOnSuccess?: boolean;
}

/**
 * react-hook-form + Zod on the client for instant inline errors, then the raw
 * values go to a server action that validates again with the same schema.
 * Server-side field errors are mapped back onto the form.
 */
export function useActionForm<TIn extends FieldValues, TOut, R>({
  schema,
  action,
  defaultValues,
  successMessage,
  onSuccess,
  resetOnSuccess = false,
}: UseActionFormOptions<TIn, TOut, R>) {
  const form = useForm<TIn, unknown, TOut>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onSubmit = form.handleSubmit(async () => {
    let result: ActionResult<R>;
    try {
      result = await action(form.getValues());
    } catch (error) {
      // Server misconfiguration or network failure — keep the form usable.
      console.error(error);
      toast.error("Something went wrong. Please try again.");
      return;
    }
    if (!result.ok) {
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) form.setError(field as Path<TIn>, { message: messages[0] });
      }
      toast.error(result.error);
      return;
    }
    const message = result.message ?? successMessage;
    if (message) toast.success(message);
    if (resetOnSuccess) form.reset(defaultValues);
    onSuccess?.(result.data);
  });

  return { form, onSubmit, pending: form.formState.isSubmitting };
}
