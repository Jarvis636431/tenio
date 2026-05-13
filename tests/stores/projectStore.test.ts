import { describe, expect, it, beforeEach } from "vitest";
import { useProjectStore } from "@/stores/projectStore";

describe("projectStore", () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
  });

  it("has null as initial currentProjectId", () => {
    expect(useProjectStore.getState().currentProjectId).toBe(null);
  });

  it("setCurrentProjectId updates the state", () => {
    useProjectStore.getState().setCurrentProjectId("project-123");
    expect(useProjectStore.getState().currentProjectId).toBe("project-123");
  });

  it("setCurrentProjectId can set to null", () => {
    useProjectStore.getState().setCurrentProjectId("project-123");
    useProjectStore.getState().setCurrentProjectId(null);
    expect(useProjectStore.getState().currentProjectId).toBe(null);
  });

  it("reset restores initial state", () => {
    useProjectStore.getState().setCurrentProjectId("project-456");
    useProjectStore.getState().reset();
    expect(useProjectStore.getState().currentProjectId).toBe(null);
  });
});
