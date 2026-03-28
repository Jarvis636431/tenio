import type { LoginPayload, LoginResponse, UserProfile } from "@/types/domain/user";
import { loginUser, registerUser, getCurrentUserProfile } from "@/services/schedulepro-service";

const TOKEN_STORAGE_KEY = "auth_token";

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await loginUser(payload);
  return {
    access_token: response.access_token,
    token_type: response.token_type,
  };
}

export async function register(payload: LoginPayload & { role?: string }): Promise<void> {
  const randomEmail = `user_${Math.random().toString(36).slice(2, 10)}@example.com`;
  await registerUser({
    username: payload.username,
    password: payload.password,
    email: randomEmail,
  });
}

export async function getCurrentUser(token: string): Promise<UserProfile> {
  const profile = await getCurrentUserProfile(token);
  return {
    user_id: profile.user_id,
    username: profile.username,
  };
}

export { TOKEN_STORAGE_KEY };
