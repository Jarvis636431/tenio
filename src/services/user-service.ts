const USER_SERVICE_BASE_URL =
  import.meta.env.VITE_USER_SERVICE_URL?.replace(/\/$/, "") || "http://localhost:8001";

const TOKEN_STORAGE_KEY = "auth_token";

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface UserProfile {
  user_id: string;
  username: string;
  role: string;
  projects?: string[];
}

async function parseError(response: Response): Promise<Error> {
  try {
    const data = await response.json();
    if (typeof data === "object" && data !== null) {
      if (typeof (data as any).message === "string") {
        return new Error((data as any).message);
      }
      if ((data as any).error?.message) {
        return new Error((data as any).error.message);
      }
      if ((data as any).detail) {
        return new Error(
          Array.isArray((data as any).detail)
            ? (data as any).detail.map((item: any) => item?.msg).filter(Boolean).join("; ")
            : (data as any).detail
        );
      }
    }
  } catch {
    // ignore parsing errors
  }

  return new Error(`请求失败 (${response.status})`);
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${USER_SERVICE_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return response.json();
}

export async function register(payload: LoginPayload & { role?: string }): Promise<void> {
  const response = await fetch(`${USER_SERVICE_BASE_URL}/register`, {
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

  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function getCurrentUser(token: string): Promise<UserProfile> {
  const response = await fetch(`${USER_SERVICE_BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return response.json();
}

export { TOKEN_STORAGE_KEY };
