import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/auth-forms";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Set a new password" };

/** Reached through the recovery email link, which establishes a session first. */
export default async function ResetPasswordPage() {
  await requireUser();
  return (
    <AuthCard title="Set a new password" description="Choose a strong password you don't use anywhere else.">
      <ResetPasswordForm />
    </AuthCard>
  );
}
