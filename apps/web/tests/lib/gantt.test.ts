import { describe, expect, it } from "vitest";
import { calculateSpanUnits } from "@/lib/gantt";

describe("gantt utilities", () => {
  it("uses explicit day duration before inclusive date span", () => {
    const start = new Date("2026-04-11T00:00:00");
    const end = new Date("2026-04-12T00:00:00");

    expect(calculateSpanUnits(start, end, "day", 1)).toBe(1);
  });

  it("falls back to inclusive date span when day duration is missing", () => {
    const start = new Date("2026-04-11T00:00:00");
    const end = new Date("2026-04-12T00:00:00");

    expect(calculateSpanUnits(start, end, "day")).toBe(2);
  });

  it("keeps week span based on dates", () => {
    const start = new Date("2026-04-01T00:00:00");
    const end = new Date("2026-04-08T00:00:00");

    expect(calculateSpanUnits(start, end, "week", 1)).toBe(2);
  });
});
