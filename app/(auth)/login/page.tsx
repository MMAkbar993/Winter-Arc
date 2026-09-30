import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/auth-forms";
import { safeRedirectPath } from "@/lib/url";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  link_expired: "That link is invalid or has expired. Request a new one.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? safeRedirectPath(params.next) : undefined;
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to continue your Winter Arc."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <LoginForm next={next} />
    </AuthCard>
  );
}
