import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFileList, getFileStats, uploadFile } from "@/features/upload";

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
            items: [],
            total: 0,
            page: 2,
            page_size: 20,
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
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/projects/project-001/files", {
      method: undefined,
      headers: {},
      body: undefined,
    });
  });

  it("uploads project files through upload credentials", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              file_id: "file-001",
              project_id: "project-001",
              storage_bucket: "tenio-dev",
              upload_url:
                "http://host.docker.internal:18000/internal/files/upload/projects/project-001/contract.pdf",
              storage_key: "projects/project-001/contract.pdf",
              expires_at: "2026-04-24T01:00:00.000Z",
              headers: {},
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              file: {
                file_id: "file-001",
                project_id: "project-001",
                original_file_name: "contract.pdf",
                stored_file_name: "contract.pdf",
                mime_type: "application/pdf",
                file_size: 1200,
                storage_bucket: "tenio-dev",
                storage_key: "projects/project-001/contract.pdf",
                category: "contract",
                status: "uploaded",
                created_at: "2026-04-24T00:00:00.000Z",
                updated_at: "2026-04-24T00:00:00.000Z",
              },
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
    expect(result.projectId).toBe("project-001");
    expect(onProgress).toHaveBeenCalledWith(0);
    expect(onProgress).toHaveBeenCalledWith(100);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/projects/project-001/uploads/init",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          original_file_name: "contract.pdf",
          file_size: 7,
          mime_type: "application/pdf",
          category: "contract",
        }),
      },
    );
    const [uploadUrl, uploadInit] = fetchMock.mock.calls[1];
    expect(uploadUrl).toBe(
      "http://host.docker.internal:18000/internal/files/upload/projects/project-001/contract.pdf",
    );
    expect(uploadInit?.method).toBe("PUT");
    expect(uploadInit?.body).toBeInstanceOf(File);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/api/projects/project-001/uploads/complete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_id: "file-001",
        }),
      },
    );
  });

  it("uses contract category for uploaded bidding documents", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              file_id: "file-bid",
              project_id: "project-001",
              storage_bucket: "tenio-dev",
              upload_url: "https://upload.example.com/bid.doc",
              storage_key: "projects/project-001/bid.doc",
              expires_at: "2026-04-24T01:00:00.000Z",
              headers: {},
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              file: {
                file_id: "file-bid",
                project_id: "project-001",
                original_file_name: "招标文件.doc",
                stored_file_name: "招标文件.doc",
                file_size: 7,
                storage_bucket: "tenio-dev",
                storage_key: "projects/project-001/bid.doc",
                category: "contract",
                status: "uploaded",
                created_at: "2026-04-24T00:00:00.000Z",
                updated_at: "2026-04-24T00:00:00.000Z",
              },
            },
          }),
      } as Response);

    await uploadFile({
      projectId: "project-001",
      file: new File(["content"], "招标文件.doc", { type: "application/msword" }),
      category: "contract",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/projects/project-001/uploads/init",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          original_file_name: "招标文件.doc",
          file_size: 7,
          mime_type: "application/msword",
          category: "contract",
        }),
      },
    );
  });

  it("creates a project before uploading when no project id is available", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              project_id: "project-created",
              project_name: "contract",
              project_status: "draft",
              created_at: "2026-04-24T00:00:00.000Z",
              updated_at: "2026-04-24T00:00:00.000Z",
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              file_id: "file-temp",
              project_id: "project-created",
              storage_bucket: "tenio-dev",
              upload_url: "https://upload.example.com/temp.pdf",
              storage_key: "projects/project-created/temp.pdf",
              expires_at: "2026-04-24T01:00:00.000Z",
              headers: {},
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              file: {
                file_id: "file-temp",
                project_id: "project-created",
                original_file_name: "contract.pdf",
                stored_file_name: "contract.pdf",
                file_size: 7,
                storage_bucket: "tenio-dev",
                storage_key: "projects/project-created/temp.pdf",
                category: "contract",
                status: "uploaded",
                created_at: "2026-04-24T00:00:00.000Z",
                updated_at: "2026-04-24T00:00:00.000Z",
              },
            },
          }),
      } as Response);

    await uploadFile({
      projectId: null,
      file: new File(["content"], "contract.pdf", { type: "application/pdf" }),
      category: "contract",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:8000/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_name: "contract",
      }),
    });
  });

  it("fetches file stats from the backend", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            total_files: 1,
            pending_files: 0,
            uploaded_files: 1,
            ready_files: 0,
            failed_files: 0,
          },
        }),
    } as Response);

    await expect(getFileStats("project-001")).resolves.toEqual({
      totalFiles: 1,
      pendingFiles: 0,
      uploadedFiles: 1,
      readyFiles: 0,
      failedFiles: 0,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/projects/project-001/files/stats",
      {
        method: undefined,
        headers: {},
        body: undefined,
      },
    );
  });
});
