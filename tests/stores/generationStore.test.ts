import { beforeEach, describe, expect, it } from "vitest";
import { useGenerationStore } from "@/stores/generationStore";

describe("generationStore", () => {
  beforeEach(() => {
    useGenerationStore.setState({ task: null });
  });

  it("tracks an active generation task", () => {
    const store = useGenerationStore.getState();

    store.startGeneration({
      projectId: "project-001",
      generationJobId: "job-001",
      generationStatus: "running",
      startedAt: "2026-05-02T00:00:00.000Z",
    });

    expect(useGenerationStore.getState().task).toMatchObject({
      projectId: "project-001",
      generationJobId: "job-001",
      generationStatus: "running",
      steps: [],
      errorMessage: null,
    });
  });

  it("updates, fails, and clears the generation task", () => {
    const store = useGenerationStore.getState();

    store.startGeneration({
      projectId: "project-001",
      generationJobId: "job-001",
      generationStatus: "running",
      startedAt: "2026-05-02T00:00:00.000Z",
    });
    store.updateGeneration({
      generationStatus: "processing",
      currentStepName: "生成施工方案",
      progressPercent: 45,
    });

    expect(useGenerationStore.getState().task).toMatchObject({
      generationStatus: "processing",
      currentStepName: "生成施工方案",
      progressPercent: 45,
    });

    store.failGeneration("生成失败");
    expect(useGenerationStore.getState().task).toMatchObject({
      generationStatus: "failed",
      errorMessage: "生成失败",
    });

    store.clearGeneration();
    expect(useGenerationStore.getState().task).toBeNull();
  });
});
