import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCurrentUser,
  loginWithPassword,
  loginWithSms,
  logoutSession,
  refreshSession,
  sendLoginSms,
  setupProfile,
} from "@/features/auth";
import { useAuthStore } from "@/stores/authStore";

describe("auth api", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    useAuthStore.getState().logout();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("sends sms login code with phone", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            phone: "13800000000",
            cooldown_seconds: 60,
            sent_at: "2026-04-28T00:00:00Z",
          },
        }),
    } as Response);

    const result = await sendLoginSms("13800000000");

    expect(result.cooldown_seconds).toBe(60);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/auth/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "13800000000" }),
    });
  });

  it("logs in with password using account field", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            access_token: "access",
            refresh_token: "refresh",
            expires_at: "2026-04-28T01:00:00Z",
            user: { user_id: "u-1", username: "张三" },
          },
        }),
    } as Response);

    await loginWithPassword({
      account: "13800000000",
      password: "password",
      has_agreed_terms: true,
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/auth/login/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account: "13800000000",
        password: "password",
        has_agreed_terms: true,
      }),
    });
  });

  it("logs in with sms code using documented fields", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            access_token: "access",
            refresh_token: "refresh",
            expires_at: "2026-04-28T01:00:00Z",
            user: { user_id: "u-1", username: "张三" },
          },
        }),
    } as Response);

    await loginWithSms({
      phone: "13800000000",
      sms_code: "123456",
      has_agreed_terms: true,
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/auth/login/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "13800000000",
        sms_code: "123456",
        has_agreed_terms: true,
      }),
    });
  });

  it("sets profile after first sms login", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            user_id: "u-1",
            username: "张三",
            account: "13800000000",
            is_profile_completed: true,
          },
        }),
    } as Response);

    await setupProfile({ username: "张三", password: "password" });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/auth/setup-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "张三", password: "password" }),
    });
  });

  it("refreshes session with refresh token", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            access_token: "new-access",
            refresh_token: "new-refresh",
            expires_at: "2026-04-28T02:00:00Z",
            user: { user_id: "u-1", username: "张三" },
          },
        }),
    } as Response);

    await refreshSession({ refresh_token: "refresh" });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: "refresh" }),
    });
  });

  it("logs out current session", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: null }),
    } as Response);

    await logoutSession();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/auth/logout", {
      method: "POST",
      headers: {},
      body: undefined,
    });
  });

  it("gets current user from /api/me", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            user_id: "u-1",
            username: "张三",
            display_name: "张三",
            role: "manager",
            role_name: "项目经理",
            avatar_text: "张",
          },
        }),
    } as Response);

    const user = await getCurrentUser();

    expect(user.user_id).toBe("u-1");
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/me", {
      method: undefined,
      headers: {},
      body: undefined,
    });
  });
});
