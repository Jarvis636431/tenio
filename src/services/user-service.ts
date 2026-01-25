const USER_SERVICE_BASE_URL =
  import.meta.env.VITE_USER_SERVICE_URL?.replace(/\/$/, "") ||
  "http://localhost:8001";

const TOKEN_STORAGE_KEY = "auth_token";

import type {
  LoginPayload,
  LoginResponse,
  UserProfile,
} from "@/types/domain/user";
import { requestJson } from "@/services/http";

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return requestJson<LoginResponse>(`${USER_SERVICE_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function register(
  payload: LoginPayload & { role?: string },
): Promise<void> {
  await requestJson<void>(`${USER_SERVICE_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: payload.username,
      password: payload.password,
      role: payload.role ?? "user",
    }),
  });
}

export async function getCurrentUser(token: string): Promise<UserProfile> {
  return requestJson<UserProfile>(`${USER_SERVICE_BASE_URL}/me`, {
    token,
  });
}

export { TOKEN_STORAGE_KEY };
