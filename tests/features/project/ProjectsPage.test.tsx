import React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  let queryClient: QueryClient;

  beforeEach(() => {
    projectApiMocks.getProjectList.mockResolvedValue({
      items: [project],
      total: 1,
      page: 1,
      page_size: 50,
    });
    projectApiMocks.getProjectMetrics.mockResolvedValue(metrics);
    projectApiMocks.deleteProject.mockResolvedValue(undefined);
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

  it("confirms and deletes a project from the project card action", async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <ProjectsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("城南综合体")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "删除项目 城南综合体" }));

    expect(screen.getByText("确认删除项目")).toBeInTheDocument();
    expect(screen.getAllByText("城南综合体").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "确认删除" }));

    await waitFor(() => {
      expect(projectApiMocks.getProjectList).toHaveBeenCalledTimes(2);
      expect(projectApiMocks.getProjectMetrics).toHaveBeenCalledTimes(2);
    });

    expect(projectApiMocks.deleteProject).toHaveBeenCalledWith("project-001");
    expect(screen.queryByText("确认删除项目")).not.toBeInTheDocument();
  });
});
