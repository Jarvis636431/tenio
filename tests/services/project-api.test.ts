import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProjectList, getProjectMetrics } from "@/features/project";
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
});
