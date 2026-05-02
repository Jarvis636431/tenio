import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectGenerationStatusDialog } from "@/features/project";
import { useGenerationStore } from "@/stores/generationStore";

const projectApiMocks = vi.hoisted(() => ({
  cancelProjectGeneration: vi.fn<() => Promise<void>>(),
  deleteProject: vi.fn<() => Promise<void>>(),
  getProjectGenerationStatus: vi.fn<() => Promise<never>>(),
}));

vi.mock("@/features/project/services/project-api", () => projectApiMocks);

describe("ProjectGenerationStatusDialog", () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    projectApiMocks.cancelProjectGeneration.mockResolvedValue(undefined);
    projectApiMocks.deleteProject.mockResolvedValue(undefined);
    projectApiMocks.getProjectGenerationStatus.mockImplementation(() => new Promise(() => {}));
    useGenerationStore.setState({ task: null });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    queryClient.clear();
    container.remove();
    document.body.innerHTML = "";
    useGenerationStore.setState({ task: null });
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("cancels active generation and deletes the pending project", async () => {
    useGenerationStore.getState().startGeneration({
      projectId: "project-001",
      generationJobId: "job-001",
      generationStatus: "running",
      startedAt: "2026-05-03T00:00:00.000Z",
    });

    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ProjectGenerationStatusDialog />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });

    const cancelButton = Array.from(document.body.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "取消生成",
    );

    expect(cancelButton).toBeDefined();

    await act(async () => {
      cancelButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(projectApiMocks.cancelProjectGeneration).toHaveBeenCalledWith("project-001");
    expect(projectApiMocks.deleteProject).toHaveBeenCalledWith("project-001");
    expect(projectApiMocks.cancelProjectGeneration.mock.invocationCallOrder[0]).toBeLessThan(
      projectApiMocks.deleteProject.mock.invocationCallOrder[0],
    );
    expect(useGenerationStore.getState().task).toBeNull();
  });
});
