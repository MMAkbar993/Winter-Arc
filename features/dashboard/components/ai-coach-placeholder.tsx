import { Sparkles } from "lucide-react";

/**
 * Placeholder for the future AI Coach. The data it would need already exists:
 * `daily_series` (habits, workouts, learning, outreach, money) plus
 * `weekly_reviews`. See features/coach/README.md for the planned design.
 */
export function AiCoachPlaceholder() {
  return (
    <section aria-labelledby="ai-coach-title" className="rounded-xl border border-dashed p-5">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden className="size-4 text-brand" />
        <h2 id="ai-coach-title" className="text-sm font-semibold">
          AI Coach — Coming Soon
        </h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Weekly insights from your habits, training, learning, outreach, finances and reviews — like “Your learning
        consistency improved this week, but outreach dropped 35%.”
      </p>
    </section>
  );
}
