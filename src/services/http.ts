import { TOKEN_STORAGE_KEY } from "@/services/user-service";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
};

export type ApiResponse<T> = {
  data: T;
  message?: string;
  status?: string;
  timestamp?: string;
  code?: number | string;
};

function getAuthHeaders(token?: string) {
  const resolvedToken = token ?? localStorage.getItem(TOKEN_STORAGE_KEY);
  return resolvedToken
    ? {
        Authorization: `Bearer ${resolvedToken}`,
      }
    : {};
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return {} as T;
    }
    return response.json() as Promise<T>;
  }

  try {
    const data = await response.json();
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
  } catch {
    throw new Error(`请求失败 (${response.status})`);
  }

  throw new Error(`请求失败 (${response.status})`);
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(input, {
    method: options.method ?? (options.body ? "POST" : undefined),
    headers: {
      ...getAuthHeaders(options.token),
      ...options.headers,
    },
    body: options.body ?? undefined,
  });

  return parseResponse<T>(response);
}

function isApiResponseEnvelope<T>(payload: unknown): payload is ApiResponse<T> {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  if (!("data" in record)) return false;
  return (
    "message" in record ||
    "status" in record ||
    "timestamp" in record ||
    "code" in record
  );
}

export function unwrapApiResponseData<T>(payload: T | ApiResponse<T>): T {
  if (isApiResponseEnvelope<T>(payload)) {
    return payload.data;
  }
  return payload as T;
}

export async function requestApiData<T>(
  input: RequestInfo | URL,
  options: RequestOptions = {},
): Promise<T> {
  const payload = await requestJson<T | ApiResponse<T>>(input, options);
  return unwrapApiResponseData(payload);
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
