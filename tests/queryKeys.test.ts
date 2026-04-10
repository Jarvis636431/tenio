import { describe, expect, it } from "vitest";
import { projectQueryKeys } from "@/features/project/queryKeys";

describe("projectQueryKeys", () => {
  it("list returns correct key", () => {
    expect(projectQueryKeys.list).toEqual(["projects"]);
  });

  it("coreGraph returns correct key with projectId", () => {
    expect(projectQueryKeys.coreGraph("p-001")).toEqual(["project", "core-graph", "p-001"]);
  });

  it("costCurve returns correct key with projectId", () => {
    expect(projectQueryKeys.costCurve("p-002")).toEqual(["overview", "cost-curve", "p-002"]);
  });

  it("headcountCurve returns correct key with projectId", () => {
    expect(projectQueryKeys.headcountCurve("p-003")).toEqual([
      "overview",
      "headcount-curve",
      "p-003",
    ]);
  });

  it("list is an array", () => {
    expect(Array.isArray(projectQueryKeys.list)).toBe(true);
  });
});
