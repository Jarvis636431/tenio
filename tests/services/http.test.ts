import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiRequestError,
  buildUrl,
  requestApiData,
  requestJson,
  unwrapApiResponseData,
} from "@/services/http";
import { useAuthStore } from "@/stores/authStore";

const localStorageMock: Storage = {
  length: 0,
  clear: vi.fn(),
  getItem: vi.fn(() => null),
  key: vi.fn(() => null),
  removeItem: vi.fn(),
  setItem: vi.fn(),
};

describe("http helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    useAuthStore.getState().logout();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("buildUrl appends only truthy query params", () => {
    const url = buildUrl("https://example.com", "/api/projects", {
      project_id: "p-001",
      empty: "",
    });

    expect(url).toBe("https://example.com/api/projects?project_id=p-001");
  });

  it("unwrapApiResponseData returns envelope data", () => {
    expect(
      unwrapApiResponseData({
        data: { ok: true },
        message: "success",
      }),
    ).toEqual({ ok: true });

    expect(unwrapApiResponseData({ ok: true })).toEqual({ ok: true });
  });

  it("requestJson sends auth header and returns parsed payload", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    } as Response);

    const result = await requestJson<{ ok: boolean }>("https://example.com/api", {
      token: "token-123",
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("https://example.com/api", {
      method: undefined,
      headers: {
        Authorization: "Bearer token-123",
      },
      body: undefined,
    });
  });

  it("requestJson uses persisted auth token when no explicit token is provided", async () => {
    const fetchMock = vi.mocked(fetch);
    useAuthStore.setState({
      accessToken: "stored-token",
      refreshToken: "refresh-token",
      expiresAt: "2026-01-01T00:00:00Z",
      user: null,
    });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    } as Response);

    await requestJson<{ ok: boolean }>("https://example.com/api");

    expect(fetchMock).toHaveBeenCalledWith("https://example.com/api", {
      method: undefined,
      headers: {
        Authorization: "Bearer stored-token",
      },
      body: undefined,
    });
  });

  it("requestApiData unwraps standard API envelopes", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            project_id: "p-001",
          },
          message: "ok",
        }),
    } as Response);

    const result = await requestApiData<{ project_id: string }>("https://example.com/api", {
      token: "token-123",
    });

    expect(result).toEqual({ project_id: "p-001" });
  });

  it("requestJson surfaces detail errors from the backend", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          detail: [{ msg: "参数错误" }],
        }),
    } as Response);

    await expect(requestJson("https://example.com/api", { token: "token-123" })).rejects.toThrow(
      "参数错误",
    );
    await expect(
      requestJson("https://example.com/api", { token: "token-123" }),
    ).rejects.toBeInstanceOf(ApiRequestError);
  });
});
