"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider } from "react-hook-form";
import { Loader2, MailCheck } from "lucide-react";
import { TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { useActionForm } from "@/hooks/use-action-form";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/features/auth/actions";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/schemas";

function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </Button>
  );
}

function useNavigate() {
  const router = useRouter();
  return (to: string) => {
    router.replace(to);
    router.refresh();
  };
}

export function LoginForm({ next }: { next?: string }) {
  const navigate = useNavigate();
  const { form, onSubmit, pending } = useActionForm({
    schema: loginSchema,
    action: (raw) => signIn(raw, next),
    defaultValues: { email: "", password: "" },
    onSuccess: (data) => navigate(data.redirectTo),
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <TextField name="email" label="Email" type="email" autoComplete="email" inputMode="email" required />
        <TextField name="password" label="Password" type="password" autoComplete="current-password" required />
        <div className="-mt-2 text-right">
          <Link href="/forgot-password" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
        <SubmitButton pending={pending}>Sign in</SubmitButton>
      </form>
    </FormProvider>
  );
}

export function RegisterForm() {
  const navigate = useNavigate();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { form, onSubmit, pending } = useActionForm({
    schema: registerSchema,
    action: signUp,
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    onSuccess: (data) => {
      if ("redirectTo" in data) navigate(data.redirectTo);
      else setSentTo(form.getValues("email"));
    },
  });

  if (sentTo) {
    return (
      <div className="grid gap-3 rounded-xl border bg-card p-5 text-center" role="status">
        <MailCheck className="mx-auto size-8 text-brand" aria-hidden />
        <p className="font-medium">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to <span className="text-foreground">{sentTo}</span>. Open it to start your
          Winter Arc.
        </p>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <TextField name="name" label="Name" autoComplete="name" required />
        <TextField name="email" label="Email" type="email" autoComplete="email" inputMode="email" required />
        <TextField
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          description="At least 8 characters."
          required
        />
        <TextField name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" required />
        <SubmitButton pending={pending}>Create account</SubmitButton>
      </form>
    </FormProvider>
  );
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const { form, onSubmit, pending } = useActionForm({
    schema: forgotPasswordSchema,
    action: requestPasswordReset,
    defaultValues: { email: "" },
    onSuccess: () => setSent(true),
  });

  if (sent) {
    return (
      <div className="grid gap-3 rounded-xl border bg-card p-5 text-center" role="status">
        <MailCheck className="mx-auto size-8 text-brand" aria-hidden />
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, a reset link is on its way. The link expires after one hour.
        </p>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <TextField name="email" label="Email" type="email" autoComplete="email" inputMode="email" required />
        <SubmitButton pending={pending}>Send reset link</SubmitButton>
      </form>
    </FormProvider>
  );
}

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const { form, onSubmit, pending } = useActionForm({
    schema: resetPasswordSchema,
    action: updatePassword,
    defaultValues: { password: "", confirmPassword: "" },
    onSuccess: (data) => navigate(data.redirectTo),
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <TextField name="password" label="New password" type="password" autoComplete="new-password" required />
        <TextField name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" required />
        <SubmitButton pending={pending}>Update password</SubmitButton>
      </form>
    </FormProvider>
  );
}
