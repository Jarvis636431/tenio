import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteFile, getFileList, getFileStats, uploadFile } from "@/features/upload";

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
              upload_url: "https://upload.example.com/contract.pdf",
              storage_key: "projects/project-001/contract.pdf",
              expire_at: "2026-04-24T01:00:00.000Z",
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
        json: () => Promise.resolve({ data: null }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              items: [
                {
                  file_id: "file-001",
                  file_category: "contract",
                  file_role: "primary_contract",
                  original_file_name: "contract.pdf",
                  file_extension: "pdf",
                  file_size_bytes: 1200,
                  upload_status: "completed",
                  uploaded_at: "2026-04-24T00:00:00.000Z",
                },
              ],
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
      "http://localhost:8000/api/projects/project-001/files/upload-init",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          original_file_name: "contract.pdf",
          file_size_bytes: 7,
          file_category: "contract",
          file_role: "primary_contract",
        }),
      },
    );
    const [uploadUrl, uploadInit] = fetchMock.mock.calls[1];
    expect(uploadUrl).toBe("https://upload.example.com/contract.pdf");
    expect(uploadInit?.method).toBe("PUT");
    expect(uploadInit?.body).toBeInstanceOf(File);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/api/projects/project-001/files/complete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_id: "file-001",
          storage_key: "projects/project-001/contract.pdf",
          upload_status: "completed",
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
              status: "created",
              created_at: "2026-04-24T00:00:00.000Z",
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
              upload_url: "https://upload.example.com/temp.pdf",
              storage_key: "projects/project-created/temp.pdf",
              expire_at: "2026-04-24T01:00:00.000Z",
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
        json: () => Promise.resolve({ data: null }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: { items: [] } }),
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
        source_type: "upload",
      }),
    });
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
      "http://localhost:8000/api/projects/project-001/files/file-001",
      {
        method: "DELETE",
        headers: {},
        body: undefined,
      },
    );
  });

  it("derives file stats from the new project file list", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            items: [
              {
                file_id: "file-001",
                file_category: "contract",
                file_role: "primary_contract",
                original_file_name: "contract.pdf",
                file_size_bytes: 1200,
                upload_status: "completed",
                uploaded_at: "2026-04-24T00:00:00.000Z",
              },
            ],
          },
        }),
    } as Response);

    await expect(getFileStats("project-001")).resolves.toEqual({
      totalFiles: 1,
      totalSize: 1200,
      categories: [{ category: "contract", count: 1, totalSize: 1200 }],
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/projects/project-001/files", {
      method: undefined,
      headers: {},
      body: undefined,
    });
  });
});
