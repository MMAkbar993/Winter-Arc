import { describe, expect, it } from "vitest";
import { resolveRange } from "@/features/analytics/range";

const ctx = { today: "2026-10-20", challengeStart: "2026-10-01", challengeEnd: "2026-12-31" };

describe("resolveRange", () => {
  it("defaults to the challenge so far once it has started", () => {
    expect(resolveRange({}, ctx)).toEqual({ from: "2026-10-01", to: "2026-10-20", preset: "challenge" });
  });

  it("defaults to 30 days before the challenge starts", () => {
    expect(resolveRange({}, { ...ctx, today: "2026-09-30" })).toEqual({ from: "2026-09-01", to: "2026-09-30", preset: "30d" });
  });

  it("resolves presets", () => {
    expect(resolveRange({ range: "week" }, ctx)).toMatchObject({ from: "2026-10-19", to: "2026-10-20" });
    expect(resolveRange({ range: "7d" }, ctx)).toMatchObject({ from: "2026-10-14" });
    expect(resolveRange({ range: "bogus" }, ctx).preset).toBe("challenge");
  });

  it("clamps custom ranges to today and a maximum length", () => {
    expect(resolveRange({ from: "2026-10-05", to: "2027-05-01" }, ctx)).toEqual({ from: "2026-10-05", to: "2026-10-20", preset: null });
    expect(resolveRange({ from: "2020-01-01", to: "2026-10-20" }, ctx).from).toBe("2025-10-20");
  });

  it("ignores invalid custom ranges", () => {
    expect(resolveRange({ from: "2026-10-10", to: "2026-10-01" }, ctx).preset).toBe("challenge");
    expect(resolveRange({ from: "nope", to: "2026-10-01" }, ctx).preset).toBe("challenge");
  });
});
