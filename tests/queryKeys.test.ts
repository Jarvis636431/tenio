import { describe, expect, it } from "vitest";
import { projectQueryKeys } from "@/features/project/queryKeys";

describe("projectQueryKeys", () => {
  it("list returns correct key", () => {
    expect(projectQueryKeys.list).toEqual(["projects"]);
  });

  it("scheduleArtifact returns correct key with projectId", () => {
    expect(projectQueryKeys.scheduleArtifact("p-001")).toEqual([
      "project",
      "artifact",
      "schedule",
      "p-001",
    ]);
  });

  it("timeCostArtifact returns correct key with projectId", () => {
    expect(projectQueryKeys.timeCostArtifact("p-002")).toEqual([
      "project",
      "artifact",
      "time-cost",
      "p-002",
    ]);
  });

  it("list is an array", () => {
    expect(Array.isArray(projectQueryKeys.list)).toBe(true);
  });
});
