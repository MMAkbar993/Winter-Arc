import { describe, expect, it } from "vitest";
import { budgetGuidance, netSavings, sumAmounts, summarizeFinances } from "@/lib/finance";
import { formatCurrency, formatMinutes } from "@/lib/format";

describe("financial totals", () => {
  it("sums amounts without floating point drift, accepting numeric strings", () => {
    expect(sumAmounts([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3);
    expect(sumAmounts([{ amount: "1500.50" }, { amount: 499.5 }, { amount: null }])).toBe(2000);
  });

  it("nets deposits against withdrawals", () => {
    expect(
      netSavings([
        { amount: 10000, kind: "deposit" },
        { amount: 2500, kind: "withdrawal" },
      ]),
    ).toBe(7500);
  });

  it("summarises a month", () => {
    const summary = summarizeFinances({
      income: [{ amount: 100000 }],
      expenses: [
        { amount: 30000, category: "essential" },
        { amount: 8000, category: "business" },
        { amount: 4000, category: "education" },
      ],
      savings: [{ amount: 25000, kind: "deposit" }],
    });
    expect(summary).toEqual({
      income: 100000,
      expenses: 42000,
      savings: 25000,
      savingsRate: 25,
      businessInvestment: 12000,
      unallocated: 33000,
    });
  });

  it("returns a 0% savings rate when there is no income", () => {
    expect(summarizeFinances({ income: [], expenses: [], savings: [{ amount: 100, kind: "deposit" }] }).savingsRate).toBe(0);
  });

  it("builds reference budget lines that total the income", () => {
    const lines = budgetGuidance(100000, [{ amount: 5000, category: "entertainment" }], 20000);
    expect(lines.reduce((a, l) => a + l.target, 0)).toBe(100000);
    expect(lines.find((l) => l.key === "fun")).toMatchObject({ target: 10000, actual: 5000 });
    expect(lines.find((l) => l.key === "savings")).toMatchObject({ target: 25000, actual: 20000 });
  });
});

describe("formatting", () => {
  it("formats currency", () => {
    expect(formatCurrency(100000, "PKR")).toBe("PKR 100,000");
    expect(formatCurrency(-250, "USD")).toBe("-USD 250");
  });

  it("formats minutes", () => {
    expect(formatMinutes(80)).toBe("1h 20m");
    expect(formatMinutes(120)).toBe("2h");
    expect(formatMinutes(0)).toBe("0m");
  });
});
