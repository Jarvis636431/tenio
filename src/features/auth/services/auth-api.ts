import { API_BASE } from "@/config";
import { request } from "@/services/http";
import type {
  AuthSession,
  AuthUser,
  PasswordLoginPayload,
  RefreshTokenPayload,
  SendSmsResponse,
  SetupProfilePayload,
  SetupProfileResponse,
  SmsLoginPayload,
} from "../types";

const APM_API_BASE = `${API_BASE.backend}/api`;

function postJson<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(`${APM_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/**
 * 发送手机验证码。
 *
 * @param phone - 手机号
 * @returns 验证码发送结果和冷却时间
 */
export function sendLoginSms(phone: string): Promise<SendSmsResponse> {
  return postJson<SendSmsResponse>("/auth/sms/send", { phone });
}

/**
 * 使用手机号和验证码登录。
 *
 * @param payload - 手机验证码登录请求字段
 * @returns 登录会话和当前用户
 */
export function loginWithSms(payload: SmsLoginPayload): Promise<AuthSession> {
  return postJson<AuthSession>("/auth/login/sms", payload);
}

/**
 * 使用手机号账号和密码登录。
 *
 * @param payload - 账号密码登录请求字段
 * @returns 登录会话和当前用户
 */
export function loginWithPassword(payload: PasswordLoginPayload): Promise<AuthSession> {
  return postJson<AuthSession>("/auth/login/password", payload);
}

/**
 * 使用刷新令牌换取新的登录会话。
 *
 * @param payload - 刷新令牌请求字段
 * @returns 新的登录会话
 */
export function refreshSession(payload: RefreshTokenPayload): Promise<AuthSession> {
  return postJson<AuthSession>("/auth/refresh", payload);
}

/**
 * 注销当前登录会话。
 *
 * @returns 注销结果
 */
export function logoutSession(): Promise<void> {
  return request<void>(`${APM_API_BASE}/auth/logout`, {
    method: "POST",
  });
}

/**
 * 为首次短信登录用户设置用户名和密码。
 *
 * @param payload - 用户资料设置请求字段
 * @returns 设置后的资料状态
 */
export function setupProfile(payload: SetupProfilePayload): Promise<SetupProfileResponse> {
  return postJson<SetupProfileResponse>("/auth/setup-profile", payload);
}

/**
 * 获取当前登录用户信息。
 *
 * @returns 当前用户信息
 */
export function getCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>(`${APM_API_BASE}/me`);
}
