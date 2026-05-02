import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectsPage } from "@/features/project";
import type { ProjectListItem, ProjectMetrics } from "@/features/project";
import { useGenerationStore } from "@/stores/generationStore";

const projectApiMocks = vi.hoisted(() => ({
  activateProjectScheme: vi.fn(),
  cancelProjectGeneration: vi.fn(),
  createMockProject: vi.fn(),
  createProject: vi.fn(),
  deleteProject: vi.fn<() => Promise<void>>(),
  getLatestCrewPlanArtifact: vi.fn(),
  getLatestDocumentArtifact: vi.fn(),
  getLatestGraphArtifact: vi.fn(),
  getProjectDetail: vi.fn(),
  getProjectGenerationStatus: vi.fn(),
  getProjectList: vi.fn(),
  getProjectMetrics: vi.fn(),
  getProjectOperationStatus: vi.fn(),
  getProjectSchemes: vi.fn(),
  getWorkbenchConsoleLogs: vi.fn(),
  getWorkbenchUploadSummary: vi.fn(),
  regenerateProjectArtifacts: vi.fn(),
  startProjectGeneration: vi.fn(),
}));

vi.mock("@/features/project/services/project-api", () => projectApiMocks);

const project: ProjectListItem = {
  project_id: "project-001",
  project_name: "城南综合体",
  short_name: "城南",
  location: "杭州",
  project_type: "商业综合体",
  building_area_sqm: 120000,
  contract_duration_days: 360,
  contract_amount_cents: 180000000,
  contract_amount_display: "1800万",
  ready_artifact_count: 3,
  progress_percent: 42,
  current_phase: "主体施工",
  status: "in_progress",
  status_label: "进行中",
  planned_start_date: "2026-01-01",
  planned_finish_date: "2026-12-31",
  actual_finish_date: null,
  remaining_days: 180,
  is_artifact_ready: true,
  created_at: "2026-01-01T00:00:00Z",
};

const metrics: ProjectMetrics = {
  total_count: 1,
  in_progress_count: 1,
  ready_artifact_count: 3,
  average_generation_seconds: 20,
  managed_count: 1,
};

describe("ProjectsPage", () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    projectApiMocks.getProjectList.mockResolvedValue({
      items: [project],
      total: 1,
      page: 1,
      page_size: 50,
    });
    projectApiMocks.getProjectMetrics.mockResolvedValue(metrics);
    projectApiMocks.deleteProject.mockResolvedValue(undefined);
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
    vi.clearAllMocks();
  });

  it("confirms and deletes a project from the project card action", async () => {
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ProjectsPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    await vi.waitFor(() => {
      expect(document.body).toHaveTextContent("城南综合体");
    });

    const deleteButton = document.body.querySelector<HTMLButtonElement>(
      'button[aria-label="删除项目 城南综合体"]',
    );

    expect(deleteButton).not.toBeNull();

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(document.body).toHaveTextContent("确认删除项目");
    expect(document.body).toHaveTextContent("城南综合体");

    const confirmButton = Array.from(document.body.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "确认删除",
    );

    await act(async () => {
      confirmButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await vi.waitFor(() => {
        expect(projectApiMocks.getProjectList).toHaveBeenCalledTimes(2);
        expect(projectApiMocks.getProjectMetrics).toHaveBeenCalledTimes(2);
      });
    });

    expect(projectApiMocks.deleteProject).toHaveBeenCalledWith("project-001");
    expect(document.body).not.toHaveTextContent("确认删除项目");
  });
});
