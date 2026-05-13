import { describe, expect, it } from "vitest";
import { getSeqNoValue, compareBySeqNo, sortBySeqNo, max, min, groupBy } from "@/lib/array";

describe("array utilities", () => {
  describe("getSeqNoValue", () => {
    it("returns number as-is", () => {
      expect(getSeqNoValue(5)).toBe(5);
      expect(getSeqNoValue(0)).toBe(0);
      expect(getSeqNoValue(-3)).toBe(-3);
    });

    it("parses string numbers", () => {
      expect(getSeqNoValue("10")).toBe(10);
      expect(getSeqNoValue("0")).toBe(0);
    });

    it("returns MAX_SAFE_INTEGER for invalid strings", () => {
      expect(getSeqNoValue("abc")).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("parses empty string as 0", () => {
      expect(getSeqNoValue("")).toBe(0);
    });

    it("returns MAX_SAFE_INTEGER for undefined", () => {
      expect(getSeqNoValue(undefined)).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe("compareBySeqNo", () => {
    it("compares items by seqNo", () => {
      expect(compareBySeqNo({ seqNo: 2 }, { seqNo: 1 })).toBeGreaterThan(0);
      expect(compareBySeqNo({ seqNo: 1 }, { seqNo: 2 })).toBeLessThan(0);
      expect(compareBySeqNo({ seqNo: 1 }, { seqNo: 1 })).toBe(0);
    });

    it("handles string seqNo", () => {
      expect(compareBySeqNo({ seqNo: "2" }, { seqNo: "1" })).toBeGreaterThan(0);
    });

    it("puts undefined at the end", () => {
      expect(compareBySeqNo({ seqNo: 1 }, {})).toBeLessThan(0);
    });
  });

  describe("sortBySeqNo", () => {
    it("sorts array by seqNo ascending", () => {
      const items = [{ seqNo: 3 }, { seqNo: 1 }, { seqNo: 2 }];
      const result = sortBySeqNo(items);
      expect(result.map((i) => i.seqNo)).toEqual([1, 2, 3]);
    });

    it("does not mutate original array", () => {
      const items = [{ seqNo: 3 }, { seqNo: 1 }];
      sortBySeqNo(items);
      expect(items[0].seqNo).toBe(3);
    });

    it("handles empty array", () => {
      expect(sortBySeqNo([])).toEqual([]);
    });
  });

  describe("max", () => {
    it("returns maximum value", () => {
      expect(max([1, 5, 3])).toBe(5);
      expect(max([-1, -5, -3])).toBe(-1);
    });

    it("returns undefined for empty array", () => {
      expect(max([])).toBe(undefined);
    });
  });

  describe("min", () => {
    it("returns minimum value", () => {
      expect(min([1, 5, 3])).toBe(1);
      expect(min([-1, -5, -3])).toBe(-5);
    });

    it("returns undefined for empty array", () => {
      expect(min([])).toBe(undefined);
    });
  });

  describe("groupBy", () => {
    it("groups items by key function", () => {
      const items = [
        { type: "a", name: "x" },
        { type: "b", name: "y" },
        { type: "a", name: "z" },
      ];
      const result = groupBy(items, (i) => i.type);
      expect(result.get("a")).toHaveLength(2);
      expect(result.get("b")).toHaveLength(1);
    });

    it("returns empty Map for empty array", () => {
      const result = groupBy([], (i) => i);
      expect(result.size).toBe(0);
    });
  });
});
