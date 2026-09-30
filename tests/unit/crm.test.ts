import { describe, expect, it } from "vitest";
import { pipelineStats, stageDates } from "@/lib/crm";
import { safeRedirectPath } from "@/lib/url";

const none = { contacted_on: null, replied_on: null, won_on: null };

describe("stageDates", () => {
  it("stamps milestone dates when a prospect advances", () => {
    expect(stageDates("contacted", none, "2026-10-05")).toEqual({
      contacted_on: "2026-10-05",
      replied_on: null,
      won_on: null,
    });
    expect(stageDates("won", none, "2026-10-05")).toEqual({
      contacted_on: "2026-10-05",
      replied_on: "2026-10-05",
      won_on: "2026-10-05",
    });
  });

  it("keeps dates that were already recorded", () => {
    const existing = { contacted_on: "2026-10-01", replied_on: "2026-10-03", won_on: null };
    expect(stageDates("proposal_sent", existing, "2026-10-09")).toEqual(existing);
  });

  it("clears the win date when moving out of won, and keeps history when lost", () => {
    const won = { contacted_on: "2026-10-01", replied_on: "2026-10-02", won_on: "2026-10-04" };
    expect(stageDates("negotiating", won, "2026-10-09").won_on).toBeNull();
    expect(stageDates("lost", won, "2026-10-09")).toEqual({ ...won, won_on: null });
    expect(stageDates("lost", none, "2026-10-09")).toEqual(none);
  });

  it("clears contact when moved back to identified", () => {
    expect(stageDates("identified", { ...none, contacted_on: "2026-10-01" }, "2026-10-09").contacted_on).toBeNull();
  });
});

describe("pipelineStats", () => {
  it("computes funnel counts, reply rate and values", () => {
    const stats = pipelineStats([
      { stage: "contacted", estimated_value: 10000, contacted_on: "2026-10-01", replied_on: null },
      { stage: "replied", estimated_value: "20000", contacted_on: "2026-10-01", replied_on: "2026-10-02" },
      { stage: "proposal_sent", estimated_value: 30000, contacted_on: "2026-10-01", replied_on: "2026-10-02" },
      { stage: "won", estimated_value: 50000, contacted_on: "2026-10-01", replied_on: "2026-10-02" },
      { stage: "lost", estimated_value: 99999, contacted_on: "2026-10-01", replied_on: null },
      { stage: "identified", estimated_value: null, contacted_on: null, replied_on: null },
    ]);
    expect(stats).toMatchObject({
      total: 6,
      contacted: 5,
      replies: 3,
      replyRate: 60,
      proposals: 2,
      calls: 2,
      won: 1,
      lost: 1,
      pipelineValue: 60000,
      wonValue: 50000,
    });
  });
});

describe("safeRedirectPath", () => {
  it("allows same-origin paths only", () => {
    expect(safeRedirectPath("/today")).toBe("/today");
    expect(safeRedirectPath("/clients?view=table")).toBe("/clients?view=table");
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
  });
});
