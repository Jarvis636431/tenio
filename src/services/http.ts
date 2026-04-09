interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: HeadersInit;
  body?: BodyInit | null;
  /** 是否自动解包 ApiResponse 包装层，默认为 true */
  unwrap?: boolean;
}

export type ApiResponse<T> = {
  data: T;
  message?: string;
  status?: string;
  timestamp?: string;
  code?: number | string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return {} as T;
    }
    return response.json() as Promise<T>;
  }

  const data = await response.json().catch(() => null);
  if (data?.message) {
    throw new Error(data.message);
  }
  if (data?.error?.message) {
    throw new Error(data.error.message);
  }
  if (data?.detail) {
    throw new Error(
      Array.isArray(data.detail)
        ? data.detail
            .map((item: { msg?: string }) => item?.msg)
            .filter(Boolean)
            .join("; ")
        : data.detail,
    );
  }

  throw new Error(`请求失败 (${response.status})`);
}

function isApiResponseEnvelope<T>(payload: unknown): payload is ApiResponse<T> {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  if (!("data" in record)) return false;
  return "message" in record || "status" in record || "timestamp" in record || "code" in record;
}

function unwrapApiResponseData<T>(payload: T | ApiResponse<T>): T {
  if (isApiResponseEnvelope<T>(payload)) {
    return payload.data;
  }
  return payload as T;
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
  const response = await fetch(input, {
    method: options.method ?? (options.body ? "POST" : undefined),
    headers: {
      ...options.headers,
    },
    body: options.body ?? undefined,
  });

  const data = await parseResponse<T | ApiResponse<T>>(response);

  // 默认自动解包 ApiResponse 包装层
  const shouldUnwrap = options.unwrap !== false;
  if (shouldUnwrap) {
    return unwrapApiResponseData(data);
  }

  return data as T;
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
    throw new Error(`SSE 请求失败 (${response.status})`);
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
