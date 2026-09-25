import React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  let queryClient: QueryClient;

  beforeEach(() => {
    projectApiMocks.cancelProjectGeneration.mockResolvedValue(undefined);
    projectApiMocks.deleteProject.mockResolvedValue(undefined);
    projectApiMocks.getProjectGenerationStatus.mockImplementation(() => new Promise(() => {}));
    useGenerationStore.setState({ task: null });
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    useGenerationStore.setState({ task: null });
    vi.clearAllMocks();
  });

  it("shows generation steps in backend order", async () => {
    const user = userEvent.setup();
    useGenerationStore.getState().startGeneration({
      projectId: "project-001",
      generationJobId: "job-001",
      generationStatus: "succeeded",
      startedAt: null,
      steps: [
        { code: "second", name: "第二步", order: 2, status: "succeeded" },
        { code: "first", name: "第一步", order: 1, status: "succeeded" },
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <ProjectGenerationStatusDialog />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("第一步").compareDocumentPosition(screen.getByText("第二步")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "留在控制台" }));
  });

  it("cancels active generation and deletes the pending project", async () => {
    const user = userEvent.setup();

    useGenerationStore.getState().startGeneration({
      projectId: "project-001",
      generationJobId: "job-001",
      generationStatus: "running",
      startedAt: "2026-05-03T00:00:00.000Z",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <ProjectGenerationStatusDialog />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "取消生成" }));

    expect(projectApiMocks.cancelProjectGeneration).toHaveBeenCalledWith("project-001");
    expect(projectApiMocks.deleteProject).toHaveBeenCalledWith("project-001");
    expect(projectApiMocks.cancelProjectGeneration.mock.invocationCallOrder[0]).toBeLessThan(
      projectApiMocks.deleteProject.mock.invocationCallOrder[0],
    );
    expect(useGenerationStore.getState().task).toBeNull();
  });
});
