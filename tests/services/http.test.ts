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

  it("refreshes the stored session and retries when API envelope reports an expired token", async () => {
    const fetchMock = vi.mocked(fetch);
    useAuthStore.setState({
      accessToken: "expired-access",
      refreshToken: "refresh-token",
      expiresAt: "2026-01-01T00:00:00Z",
      user: null,
    });
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: false,
            code: "AUTH_TOKEN_EXPIRED",
            message: "Token已过期",
            data: null,
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              access_token: "new-access",
              refresh_token: "new-refresh",
              expires_at: "2026-01-01T01:00:00Z",
              user: {
                user_id: "u-1",
                username: "张三",
                display_name: "张三",
                role: "manager",
                role_name: "项目经理",
                avatar_text: "张",
              },
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              project_id: "p-001",
            },
          }),
      } as Response);

    const result = await requestApiData<{ project_id: string }>("https://example.com/api/projects");

    expect(result).toEqual({ project_id: "p-001" });
    expect(useAuthStore.getState().accessToken).toBe("new-access");
    expect(useAuthStore.getState().refreshToken).toBe("new-refresh");
    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://example.com/api/projects", {
      method: undefined,
      headers: {
        Authorization: "Bearer expired-access",
      },
      body: undefined,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:8000/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: "refresh-token" }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, "https://example.com/api/projects", {
      method: undefined,
      headers: {
        Authorization: "Bearer new-access",
      },
      body: undefined,
    });
  });

  it("clears the stored session when automatic token refresh fails", async () => {
    const fetchMock = vi.mocked(fetch);
    useAuthStore.setState({
      accessToken: "expired-access",
      refreshToken: "refresh-token",
      expiresAt: "2026-01-01T00:00:00Z",
      user: null,
    });
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            code: "AUTH_TOKEN_EXPIRED",
            message: "Token已过期",
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            message: "刷新令牌已过期",
          }),
      } as Response);

    await expect(requestJson("https://example.com/api/projects")).rejects.toThrow("刷新令牌已过期");
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
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
