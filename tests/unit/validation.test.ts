import { describe, expect, it } from "vitest";
import {
  expenseSchema,
  incomeSchema,
  learningSessionSchema,
  onboardingSchema,
  prospectSchema,
  registerSchema,
  workSessionSchema,
  workoutSchema,
} from "@/lib/validation/schemas";

const firstError = (result: { success: boolean; error?: { issues: { message: string; path: PropertyKey[] }[] } }) =>
  result.error?.issues[0];

const onboardingBase = {
  name: "Mujeeb",
  challengeName: "Winter Arc 2026",
  startDate: "2026-10-01",
  endDate: "2026-12-31",
  timezone: "Asia/Karachi",
  dailyLearningTargetMinutes: "120",
  weeklyWorkoutTarget: "5",
  dailyOutreachTarget: "15",
  monthlyIncomeGoal: "150000",
  monthlySavingsGoal: "40000",
};

describe("onboarding validation", () => {
  it("accepts the default challenge and parses numbers", () => {
    const parsed = onboardingSchema.parse(onboardingBase);
    expect(parsed.dailyLearningTargetMinutes).toBe(120);
    expect(parsed.monthlyIncomeGoal).toBe(150000);
  });

  it("rejects impossible challenge ranges", () => {
    const res = onboardingSchema.safeParse({ ...onboardingBase, endDate: "2026-09-01" });
    expect(res.success).toBe(false);
    expect(firstError(res)).toMatchObject({ path: ["endDate"], message: "End date must be after the start date" });
  });

  it("rejects invalid dates and timezones", () => {
    expect(onboardingSchema.safeParse({ ...onboardingBase, startDate: "2026-02-31" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...onboardingBase, timezone: "Mars/Olympus" }).success).toBe(false);
  });

  it("rejects negative targets", () => {
    const res = onboardingSchema.safeParse({ ...onboardingBase, monthlySavingsGoal: "-1" });
    expect(firstError(res)?.message).toBe("Monthly savings goal cannot be negative");
  });
});

describe("money validation", () => {
  const income = { date: "2026-10-05", amount: "15,000", category: "fiverr" };

  it("parses formatted amounts", () => {
    expect(incomeSchema.parse(income).amount).toBe(15000);
  });

  it("rejects zero, negative and non-numeric amounts", () => {
    expect(firstError(incomeSchema.safeParse({ ...income, amount: "-50" }))?.message).toBe("Amount must be greater than 0");
    expect(firstError(expenseSchema.safeParse({ ...income, category: "business", amount: "0" }))?.message).toBe(
      "Amount must be greater than 0",
    );
    expect(firstError(incomeSchema.safeParse({ ...income, amount: "abc" }))?.message).toBe("Amount must be a number");
  });

  it("normalises empty optional text to null", () => {
    expect(incomeSchema.parse({ ...income, notes: "   " }).notes).toBeNull();
  });
});

describe("duration validation", () => {
  const session = { date: "2026-10-05", topic: "Server Actions", category: "nextjs", duration: "90", completed: true };

  it("rejects negative or zero durations", () => {
    expect(learningSessionSchema.safeParse({ ...session, duration: "-30" }).success).toBe(false);
    expect(learningSessionSchema.safeParse({ ...session, duration: "0" }).success).toBe(false);
    expect(learningSessionSchema.parse(session).duration).toBe(90);
  });

  it("computes work duration from start/end times and rejects reversed ranges", () => {
    const base = {
      projectId: "3f0b3a4e-1a6b-4a38-9d7c-4a3a7a2f7c11",
      date: "2026-10-05",
      task: "Build checkout",
      billable: true,
    };
    expect(workSessionSchema.parse({ ...base, startTime: "09:00", endTime: "11:30" }).duration).toBe(150);
    expect(firstError(workSessionSchema.safeParse({ ...base, startTime: "11:00", endTime: "09:00" }))?.message).toBe(
      "End time must be after start time",
    );
    expect(firstError(workSessionSchema.safeParse(base))?.message).toBe("Enter a duration or start and end times");
  });

  it("requires a name for custom workouts", () => {
    const res = workoutSchema.safeParse({ date: "2026-10-05", category: "custom", duration: "45", exercises: [] });
    expect(firstError(res)).toMatchObject({ path: ["customCategory"] });
  });
});

describe("misc validation", () => {
  it("requires matching passwords", () => {
    const res = registerSchema.safeParse({
      name: "A",
      email: "a@example.com",
      password: "longenough",
      confirmPassword: "different",
    });
    expect(firstError(res)).toMatchObject({ path: ["confirmPassword"] });
  });

  it("rejects unsafe URLs", () => {
    const res = prospectSchema.safeParse({ name: "Ali", source: "linkedin", stage: "identified", profileUrl: "javascript:alert(1)" });
    expect(res.success).toBe(false);
  });

  it("strips control characters from text", () => {
    const res = prospectSchema.parse({ name: "Ali\u0000 Khan", source: "linkedin", stage: "identified" });
    expect(res.name).toBe("Ali Khan");
  });
});
