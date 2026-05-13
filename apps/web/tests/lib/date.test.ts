import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatIsoDate,
  getCurrentDate,
  parseDate,
  toDate,
  normalizeToMidday,
  formatDateString,
} from "@/lib/date";

describe("date utilities", () => {
  describe("formatDate", () => {
    it("formats date as yyyy-mm-dd by default", () => {
      const date = new Date(2025, 0, 15);
      expect(formatDate(date)).toBe("2025-01-15");
    });

    it("formats date as yyyy/mm/dd", () => {
      const date = new Date(2025, 5, 8);
      expect(formatDate(date, "yyyy/mm/dd")).toBe("2025/06/08");
    });

    it("formats date as mm/dd", () => {
      const date = new Date(2025, 11, 25);
      expect(formatDate(date, "mm/dd")).toBe("12/25");
    });

    it("formats date as yyyy/mm", () => {
      const date = new Date(2025, 3, 1);
      expect(formatDate(date, "yyyy/mm")).toBe("2025/4");
    });

    it("returns empty string for null/undefined date", () => {
      expect(formatDate(null)).toBe("");
      expect(formatDate(undefined)).toBe("");
    });

    it("returns empty string for invalid date", () => {
      const invalid = new Date("invalid");
      expect(formatDate(invalid)).toBe("");
    });
  });

  describe("formatDateTime", () => {
    it("formats datetime correctly", () => {
      const date = new Date(2025, 0, 15, 14, 30);
      expect(formatDateTime(date)).toBe("2025-01-15 14:30");
    });

    it("handles ISO string input", () => {
      expect(formatDateTime("2025-01-15T08:00:00")).toBe("2025-01-15 08:00");
    });

    it("returns dash for null/undefined", () => {
      expect(formatDateTime(null)).toBe("-");
      expect(formatDateTime(undefined)).toBe("-");
    });
  });

  describe("formatIsoDate", () => {
    it("extracts date portion without time", () => {
      expect(formatIsoDate("2025-01-15T10:30:00")).toBe("2025-01-15");
    });

    it("extracts date with time when includeTime is true", () => {
      expect(formatIsoDate("2025-01-15T10:30:00", true)).toBe("2025-01-15 10:30");
    });

    it("returns dash for null/undefined", () => {
      expect(formatIsoDate(null)).toBe("-");
      expect(formatIsoDate(undefined)).toBe("-");
    });
  });

  describe("getCurrentDate", () => {
    it("returns formatted current date", () => {
      const result = getCurrentDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("parseDate", () => {
    it("parses ISO date strings", () => {
      const result = parseDate("2025-01-15");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
    });

    it("parses yyyy/mm/dd format", () => {
      const result = parseDate("2025/09/01");
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(8);
      expect(result?.getDate()).toBe(1);
    });

    it("parses yyyy/mm/dd hh:mm format", () => {
      const result = parseDate("2025/09/01 08:30");
      expect(result?.getHours()).toBe(8);
      expect(result?.getMinutes()).toBe(30);
    });

    it("parses relative format with time", () => {
      const result = parseDate("第3天 10:00");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(3);
      expect(result?.getHours()).toBe(10);
    });

    it("parses relative format without time", () => {
      const result = parseDate("第5天");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(5);
      expect(result?.getHours()).toBe(0);
    });

    it("parses legacy month/day format", () => {
      const result = parseDate("8月15日");
      expect(result?.getMonth()).toBe(7);
      expect(result?.getDate()).toBe(15);
    });

    it("returns null for invalid date", () => {
      expect(parseDate("")).toBe(null);
      expect(parseDate("invalid")).toBe(null);
    });

    it("returns baseline date when defaultToBaseline is true", () => {
      const result = parseDate("invalid", true);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
    });
  });

  describe("toDate", () => {
    it("parses valid date string", () => {
      const result = toDate("2025-01-15");
      expect(result).toBeInstanceOf(Date);
    });

    it("returns null for invalid date", () => {
      expect(toDate(null)).toBe(null);
      expect(toDate(undefined)).toBe(null);
      expect(toDate("invalid")).toBe(null);
    });
  });

  describe("normalizeToMidday", () => {
    it("sets time to 12:00:00", () => {
      const date = new Date(2025, 0, 15, 8, 30, 45);
      const result = normalizeToMidday(date);
      expect(result.getHours()).toBe(12);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe("formatDateString", () => {
    it("formats Date object to yyyy-mm-dd", () => {
      const date = new Date(2025, 0, 15, 12, 0, 0);
      const result = formatDateString(date);
      expect(result).toMatch(/^2025-01-1[45]$/);
    });

    it("handles yyyy-mm-dd string directly", () => {
      expect(formatDateString("2025-01-15")).toBe("2025-01-15");
    });

    it("returns dash for null/undefined", () => {
      expect(formatDateString(null)).toBe("-");
      expect(formatDateString(undefined)).toBe("-");
    });
  });
});
