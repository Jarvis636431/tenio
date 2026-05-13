import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activateProjectScheme,
  cancelProjectGeneration,
  createMockProject,
  createProject,
  deleteProject,
  getLatestCrewPlanArtifact,
  getLatestDocumentArtifact,
  getLatestGraphArtifact,
  getProjectDetail,
  getProjectList,
  getProjectMetrics,
  getProjectOperationStatus,
  getProjectSchemes,
  getWorkbenchConsoleLogs,
  getWorkbenchUploadSummary,
  regenerateProjectArtifacts,
} from "@/features/project";
import { useAuthStore } from "@/stores/authStore";

describe("project api", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    useAuthStore.getState().logout();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("gets project metrics from documented endpoint", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            total_count: 8,
            in_progress_count: 3,
            ready_artifact_count: 12,
            average_generation_seconds: 42,
            managed_count: 5,
          },
        }),
    } as Response);

    const metrics = await getProjectMetrics();

    expect(metrics.total_count).toBe(8);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/projects/metrics", {
      method: undefined,
      headers: {},
      body: undefined,
    });
  });

  it("gets project list with server-side filters and pagination", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            items: [],
            total: 0,
            page: 2,
            page_size: 20,
          },
        }),
    } as Response);

    const result = await getProjectList({
      status: "completed",
      keyword: "住宅",
      page: 2,
      page_size: 20,
    });

    expect(result.page).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/projects?status=completed&keyword=%E4%BD%8F%E5%AE%85&page=2&page_size=20",
      {
        method: undefined,
        headers: {},
        body: undefined,
      },
    );
  });

  it("creates standard and mock projects through documented endpoints", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            project_id: "p-001",
            project_name: "项目",
            status: "created",
            created_at: "2026-04-30T00:00:00Z",
          },
        }),
    } as Response);

    await createProject({ project_name: "项目", source_type: "manual_create" });
    await createMockProject({ mock_dataset_code: "demo" });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:8000/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_name: "项目", source_type: "manual_create" }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:8000/api/projects/mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mock_dataset_code: "demo" }),
    });
  });

  it("gets project detail and latest artifact endpoints from current OpenAPI", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: {} }),
    } as Response);

    await getProjectDetail("p-001");
    await getLatestDocumentArtifact("p-001");
    await getLatestGraphArtifact("p-001");
    await getLatestCrewPlanArtifact("p-001");

    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:8000/api/projects/p-001", {
      method: undefined,
      headers: {},
      body: undefined,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/projects/p-001/artifacts/document/latest",
      { method: undefined, headers: {}, body: undefined },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/api/projects/p-001/artifacts/graph/latest",
      { method: undefined, headers: {}, body: undefined },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:8000/api/projects/p-001/artifacts/crew-plan/latest",
      { method: undefined, headers: {}, body: undefined },
    );
  });

  it("calls generation regenerate and workbench endpoints", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] }),
    } as Response);

    await regenerateProjectArtifacts("p-001", { artifact_types: ["graph"], reason: "重算" });
    await getProjectOperationStatus("p-001", "op-001");
    await getWorkbenchUploadSummary("p-001");
    await getWorkbenchConsoleLogs("p-001");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/projects/p-001/generation/regenerate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artifact_types: ["graph"], reason: "重算" }),
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/projects/p-001/operations/op-001",
      { method: undefined, headers: {}, body: undefined },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/api/projects/p-001/workbench/upload-summary",
      { method: undefined, headers: {}, body: undefined },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:8000/api/projects/p-001/workbench/console-logs",
      { method: undefined, headers: {}, body: undefined },
    );
  });

  it("cancels generation and deletes pending projects through documented endpoints", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: null }),
    } as Response);

    await cancelProjectGeneration("p-001");
    await deleteProject("p-001");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/projects/p-001/generation/cancel",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: undefined,
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:8000/api/projects/p-001", {
      method: "DELETE",
      headers: {},
      body: undefined,
    });
  });

  it("calls project schemes endpoints", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: { items: [] } }),
    } as Response);

    await getProjectSchemes("p-001");
    await activateProjectScheme("p-001", "scheme-001");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/projects/p-001/schemes",
      { method: undefined, headers: {}, body: undefined },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/projects/p-001/schemes/scheme-001/activate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: undefined,
      },
    );
  });
});
