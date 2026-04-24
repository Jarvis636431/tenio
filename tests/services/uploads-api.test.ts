import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteFile,
  getFileDownloadUrl,
  getFileList,
  getFileStats,
  updateFile,
  uploadFile,
} from "@/features/upload";

describe("uploads-api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("fetches a project file list from the backend", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            list: [],
            total: 0,
            page: 2,
            pageSize: 20,
          },
          message: "ok",
        }),
    } as Response);

    const result = await getFileList({
      projectId: "project-001",
      category: "drawing",
      keyword: "cad",
      page: 2,
      pageSize: 20,
    });

    expect(result.total).toBe(0);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/projects/project-001/files?category=drawing&keyword=cad&page=2&page_size=20",
      {
        method: undefined,
        headers: {},
        body: undefined,
      },
    );
  });

  it("uploads project files with form data", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            fileId: "file-001",
            name: "contract.pdf",
            url: "/uploads/contract.pdf",
            size: 1200,
            uploadedAt: "2026-04-24T00:00:00.000Z",
          },
        }),
    } as Response);
    const onProgress = vi.fn();

    const result = await uploadFile(
      {
        projectId: "project-001",
        file: new File(["content"], "contract.pdf", { type: "application/pdf" }),
        category: "contract",
        description: "合同",
        tags: ["重要"],
      },
      onProgress,
    );

    expect(result.fileId).toBe("file-001");
    expect(onProgress).toHaveBeenCalledWith(0);
    expect(onProgress).toHaveBeenCalledWith(100);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8000/api/v1/projects/project-001/files");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    expect(init?.headers).toEqual({});
  });

  it("uploads temporary files when no project id is available", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          fileId: "file-temp",
          name: "contract.pdf",
          url: "/uploads/contract.pdf",
          size: 1200,
          uploadedAt: "2026-04-24T00:00:00.000Z",
        }),
    } as Response);

    await uploadFile({
      projectId: null,
      file: new File(["content"], "contract.pdf", { type: "application/pdf" }),
      category: "contract",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8000/api/v1/files");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({});
    expect(init?.body).toBeInstanceOf(FormData);
  });

  it("deletes project files through the backend", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    } as Response);

    await deleteFile({ projectId: "project-001", fileId: "file-001" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/projects/project-001/files/file-001",
      {
        method: "DELETE",
        headers: {},
        body: undefined,
      },
    );
  });

  it("updates file metadata through the backend", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: "file-001",
          projectId: "project-001",
          name: "updated.pdf",
          originalName: "original.pdf",
          size: 1200,
          type: "application/pdf",
          category: "document",
          url: "/uploads/updated.pdf",
          uploadedAt: "2026-04-24T00:00:00.000Z",
          status: "completed",
        }),
    } as Response);

    await updateFile({ fileId: "file-001", name: "updated.pdf", tags: ["图纸"] });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/files/file-001", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "updated.pdf", tags: ["图纸"] }),
    });
  });

  it("fetches file stats and download URLs through the backend", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              totalFiles: 0,
              totalSize: 0,
              categories: [],
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              url: "https://example.com/download/file-001",
            },
          }),
      } as Response);

    await expect(getFileStats("project-001")).resolves.toEqual({
      totalFiles: 0,
      totalSize: 0,
      categories: [],
    });
    await expect(getFileDownloadUrl("file-001")).resolves.toBe(
      "https://example.com/download/file-001",
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/v1/projects/project-001/files/stats",
      {
        method: undefined,
        headers: {},
        body: undefined,
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/v1/files/file-001/download",
      {
        method: undefined,
        headers: {},
        body: undefined,
      },
    );
  });
});
