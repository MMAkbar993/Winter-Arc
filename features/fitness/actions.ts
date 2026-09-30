"use server";

import { assertNoDbError, runAction } from "@/lib/actions";
import { deleteAction, saveOwned } from "@/lib/crud";
import { bodyMetricSchema, workoutSchema } from "@/lib/validation/schemas";
import { autoCompleteHabit } from "@/features/habits/auto-complete";

export async function saveWorkout(raw: unknown, id?: string) {
  return runAction(
    workoutSchema,
    raw,
    async (input, ctx) => {
      const workoutId = await saveOwned(
        ctx,
        "workouts",
        {
          workout_date: input.date,
          category: input.category,
          custom_category: input.category === "custom" ? input.customCategory : null,
          duration_minutes: input.duration,
          notes: input.notes,
        },
        id,
      );

      // Replace the exercise list wholesale — simplest correct edit semantics.
      if (id) {
        const { error } = await ctx.supabase
          .from("workout_exercises")
          .delete()
          .eq("workout_id", workoutId)
          .eq("user_id", ctx.user.id);
        assertNoDbError(error, "clear exercises");
      }
      if (input.exercises.length > 0) {
        const { error } = await ctx.supabase.from("workout_exercises").insert(
          input.exercises.map((e, position) => ({
            user_id: ctx.user.id,
            workout_id: workoutId,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            weight_kg: e.weight,
            position,
          })),
        );
        assertNoDbError(error, "insert exercises");
      }

      await autoCompleteHabit(ctx, input.date, "workout");
      return { id: workoutId };
    },
    { successMessage: id ? "Workout updated" : "Workout logged. Another day, another rep." },
  );
}

export async function deleteWorkout(id: string) {
  return deleteAction("workouts", id);
}

export async function saveBodyMetric(raw: unknown, id?: string) {
  return runAction(
    bodyMetricSchema,
    raw,
    async (input, ctx) =>
      saveOwned(
        ctx,
        "body_metrics",
        {
          measured_on: input.date,
          body_weight_kg: input.bodyWeight,
          waist_cm: input.waist,
          chest_cm: input.chest,
          arms_cm: input.arms,
          photo_url: input.photoUrl,
          notes: input.notes,
        },
        id,
      ),
    { successMessage: "Measurements saved" },
  );
}

export async function deleteBodyMetric(id: string) {
  return deleteAction("body_metrics", id);
}
