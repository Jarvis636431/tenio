import { describe, expect, it } from "vitest";
import { isLagTask, formatDurationDays, formatWorkerCount } from "@/lib/task";

describe("task utilities", () => {
  describe("isLagTask", () => {
    it("returns true for lag tasks", () => {
      expect(isLagTask("lag")).toBe(true);
      expect(isLagTask("LAG")).toBe(true);
      expect(isLagTask("Lag Task")).toBe(true);
      expect(isLagTask("lag 1")).toBe(true);
    });

    it("returns false for non-lag tasks", () => {
      expect(isLagTask("Task A")).toBe(false);
      expect(isLagTask("delivery")).toBe(false);
    });

    it("handles undefined/null", () => {
      expect(isLagTask(undefined)).toBe(false);
      expect(isLagTask(null)).toBe(false);
      expect(isLagTask("")).toBe(false);
    });
  });

  describe("formatDurationDays", () => {
    it("formats number with one decimal", () => {
      expect(formatDurationDays(3)).toBe("3.0");
      expect(formatDurationDays(3.5)).toBe("3.5");
      expect(formatDurationDays(3.14159)).toBe("3.1");
    });

    it("parses string numbers", () => {
      expect(formatDurationDays("5")).toBe("5.0");
      expect(formatDurationDays("2.5天")).toBe("2.5");
    });

    it("strips non-numeric characters from strings", () => {
      expect(formatDurationDays("10个工作日")).toBe("10.0");
    });

    it("handles non-numeric strings", () => {
      expect(formatDurationDays("abc")).toBe("0.0");
    });
  });

  describe("formatWorkerCount", () => {
    it("formats finite numbers as rounded integers", () => {
      expect(formatWorkerCount(5)).toBe("5");
      expect(formatWorkerCount(5.6)).toBe("6");
      expect(formatWorkerCount(5.4)).toBe("5");
      expect(formatWorkerCount(0)).toBe("0");
    });

    it("handles string numbers", () => {
      expect(formatWorkerCount("10")).toBe("10");
      expect(formatWorkerCount("5.9")).toBe("6");
    });

    it("returns 0 for non-finite values", () => {
      expect(formatWorkerCount(NaN)).toBe("0");
      expect(formatWorkerCount(Infinity)).toBe("0");
      expect(formatWorkerCount("abc")).toBe("0");
      expect(formatWorkerCount(null)).toBe("0");
    });
  });
});
