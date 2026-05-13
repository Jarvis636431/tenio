import { API_BASE } from "@/config";
import { useAuthStore } from "@/stores/authStore";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: HeadersInit;
  body?: BodyInit | null;
  token?: string;
  /** 是否自动解包 ApiResponse 包装层，默认为 true */
  unwrap?: boolean;
}

export type ApiResponse<T> = {
  data: T;
  message?: string;
  status?: string;
  timestamp?: string;
  code?: number | string;
  success?: boolean;
};

type AuthSessionPayload = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user: {
    user_id: string;
    username: string;
    display_name: string;
    role: string;
    role_name: string;
    avatar_text: string;
    account?: string;
    is_profile_completed?: boolean;
  };
};

const AUTH_TOKEN_EXPIRED_CODE = "AUTH_TOKEN_EXPIRED";
const APM_API_BASE = `${API_BASE.backend}/api`;
let refreshSessionPromise: Promise<AuthSessionPayload> | null = null;

export class ApiRequestError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.data = data;
  }
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

function getRequestUrl(input: RequestInfo | URL): string {
  if (input instanceof Request) return input.url;
  return input.toString();
}

function isRefreshRequest(input: RequestInfo | URL): boolean {
  return getRequestUrl(input).includes("/auth/refresh");
}

function isAuthTokenExpiredPayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return record.code === AUTH_TOKEN_EXPIRED_CODE;
}

function isAuthTokenExpiredError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.status === 401 || error.status === 403 || isAuthTokenExpiredPayload(error.data))
  );
}

function shouldRefreshAuthToken(error: unknown, sentAccessToken: boolean): boolean {
  if (!(error instanceof ApiRequestError)) {
    return false;
  }

  if (isAuthTokenExpiredPayload(error.data)) {
    return true;
  }

  return sentAccessToken && (error.status === 401 || error.status === 403);
}

function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;

  if (typeof record.message === "string") {
    return record.message;
  }

  if (record.error && typeof record.error === "object") {
    const errorRecord = record.error as Record<string, unknown>;
    if (typeof errorRecord.message === "string") {
      return errorRecord.message;
    }
  }

  if (record.detail) {
    if (typeof record.detail === "string") return record.detail;
    if (Array.isArray(record.detail)) {
      const messages = record.detail
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => (typeof item.msg === "string" ? item.msg : undefined))
        .filter((msg): msg is string => !!msg);
      return messages.join("; ") || null;
    }
  }

  return null;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return {} as T;
    }
    const payload = (await response.json()) as T;
    if (isAuthTokenExpiredPayload(payload)) {
      const message = extractErrorMessage(payload) ?? "Token已过期";
      throw new ApiRequestError(message, response.status, payload);
    }
    return payload;
  }

  const data = (await response.json().catch(() => null)) as unknown;
  const message = extractErrorMessage(data);
  throw new ApiRequestError(message ?? `请求失败 (${response.status})`, response.status, data);
}

function isApiResponseEnvelope<T>(payload: unknown): payload is ApiResponse<T> {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  if (!("data" in record)) return false;
  return true;
}

export function unwrapApiResponseData<T>(payload: T | ApiResponse<T>): T {
  if (isApiResponseEnvelope<T>(payload)) {
    return payload.data;
  }
  return payload;
}

function buildRequestHeaders(options: RequestOptions): HeadersInit {
  const token = options.token ?? useAuthStore.getState().accessToken ?? undefined;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
}

function canRefreshRequest(input: RequestInfo | URL, options: RequestOptions): boolean {
  return !options.token && !isRefreshRequest(input);
}

async function refreshStoredSession(): Promise<AuthSessionPayload> {
  if (refreshSessionPromise) {
    return refreshSessionPromise;
  }

  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    throw new ApiRequestError("登录已过期，请重新登录", 401, null);
  }

  refreshSessionPromise = fetch(`${APM_API_BASE}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (response) => {
      const payload = await parseResponse<ApiResponse<AuthSessionPayload>>(response);
      const session = unwrapApiResponseData(payload);
      useAuthStore.getState().setSession(session);
      return session;
    })
    .catch((error: unknown) => {
      useAuthStore.getState().logout();
      throw error;
    })
    .finally(() => {
      refreshSessionPromise = null;
    });

  return refreshSessionPromise;
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  options: RequestOptions = {},
  allowAuthRefresh = true,
): Promise<T> {
  const headers = buildRequestHeaders(options);
  const sentAccessToken = !options.token && "Authorization" in headers;

  try {
    const response = await fetch(input, {
      method: options.method ?? (options.body ? "POST" : undefined),
      headers,
      body: options.body ?? undefined,
    });

    return await parseResponse<T>(response);
  } catch (error) {
    if (
      allowAuthRefresh &&
      canRefreshRequest(input, options) &&
      isAuthTokenExpiredError(error) &&
      shouldRefreshAuthToken(error, sentAccessToken)
    ) {
      await refreshStoredSession();
      return requestJson<T>(input, options, false);
    }

    throw error;
  }
}

export async function requestApiData<T>(
  input: RequestInfo | URL,
  options: RequestOptions = {},
): Promise<T> {
  const payload = await requestJson<T | ApiResponse<T>>(input, options);
  return unwrapApiResponseData(payload);
}

/**
 * 发送 HTTP 请求并解析响应
 * @param input - 请求 URL
 * @param options - 请求选项
 * @returns 响应数据（默认自动解包 ApiResponse）
 */
export async function request<T>(
  input: RequestInfo | URL,
  options: RequestOptions = {},
): Promise<T> {
  if (options.unwrap === false) {
    return requestJson<T>(input, options);
  }

  return requestApiData<T>(input, options);
}

export function buildUrl(base: string, path: string, params?: Record<string, string>) {
  const url = new URL(`${base}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

// ============================================================================
// SSE (Server-Sent Events) 请求支持
// ============================================================================

export type SseMessageHandler = (data: unknown) => void;
export type SseDoneHandler = () => void;
export type SseErrorHandler = (error: Error) => void;

export interface SseRequestOptions {
  method?: "GET" | "POST";
  headers?: HeadersInit;
  body?: BodyInit | null;
  signal?: AbortSignal;
  onMessage?: SseMessageHandler;
  onDone?: SseDoneHandler;
  onError?: SseErrorHandler;
}

/**
 * 解析 SSE 数据行，提取 data 字段内容
 */
function parseSseLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  return trimmed.replace(/^data:\s*/, "");
}

/**
 * 发送 SSE 请求并处理流式响应
 * @returns 返回响应对象，可用于中断请求
 */
export async function requestSse(
  input: RequestInfo | URL,
  options: SseRequestOptions = {},
): Promise<Response> {
  const response = await fetch(input, {
    method: options.method ?? "POST",
    headers: {
      Accept: "text/event-stream",
      ...options.headers,
    },
    body: options.body ?? undefined,
    signal: options.signal,
  });

  if (!response.ok || !response.body) {
    const data = (await response.json().catch(() => null)) as unknown;
    const message = extractErrorMessage(data);
    throw new ApiRequestError(
      message ?? `SSE 请求失败 (${response.status})`,
      response.status,
      data,
    );
  }

  // 如果提供了回调，自动处理流
  if (options.onMessage || options.onDone || options.onError) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    const processStream = async () => {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const lines = part
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean);

            for (const line of lines) {
              const data = parseSseLine(line);
              if (data === null) continue;

              if (data === "[DONE]") {
                options.onDone?.();
                return;
              }

              try {
                const payload = JSON.parse(data) as unknown;
                options.onMessage?.(payload);
              } catch {
                // 非 JSON 数据，直接传递原始字符串
                options.onMessage?.(data);
              }
            }
          }
        }
        options.onDone?.();
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        options.onError?.(error as Error);
      }
    };

    void processStream();
  }

  return response;
}
