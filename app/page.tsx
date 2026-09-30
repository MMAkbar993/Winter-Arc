import Link from "next/link";
import { ArrowRight, CalendarCheck2, Flame, LineChart, Target } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { HABITS, TAGLINE } from "@/lib/constants";

const FEATURES = [
  { icon: Target, title: "Daily Seven", body: "One checklist, seven habits, a score out of 7. Done in under two minutes." },
  { icon: Flame, title: "Honest streaks", body: "A day counts when you hit your threshold. No zero days." },
  { icon: CalendarCheck2, title: "92-day heatmap", body: "See every day of the arc at a glance and spot the gaps early." },
  { icon: LineChart, title: "Real outcomes", body: "Workouts, learning hours, outreach, clients, revenue and savings." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6">
        <section className="surface-glow mt-6 rounded-3xl border px-6 py-16 sm:px-12 sm:py-24">
          <p className="text-sm font-medium text-brand">Winter Arc 2026 · Oct 1 → Dec 31</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">{TAGLINE}</h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground text-pretty sm:text-lg">
            A calm, focused operating system for a 90-day transformation: fitness, deep learning, client acquisition,
            paid work, content and money — all on one scoreboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-11 px-5">
              <Link href="/register">
                Start your arc <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-5">
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
          <ul className="mt-12 flex flex-wrap gap-2" aria-label="The Daily Seven">
            {HABITS.map((h, i) => (
              <li key={h.value} className="rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                <span className="mr-1.5 text-foreground tabular">{i + 1}</span>
                {h.mission}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 py-16 sm:grid-cols-2 lg:grid-cols-4" aria-label="Features">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-5">
              <f.icon className="size-5 text-brand" aria-hidden />
              <h2 className="mt-4 font-medium">{f.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-xs text-muted-foreground sm:px-6">
        Consistency beats intensity.
      </footer>
    </div>
  );
}
