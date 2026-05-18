/**
 * 认证相关类型继承自 @tenio/shared 共享包，
 * 确保前端和后端的 API 契约一致。
 */
export type { AuthUser, AuthSession, SendSmsResponse, SetupProfileResponse } from "@tenio/shared";

import type {
  PasswordLoginRequest,
  SmsLoginRequest,
  SetupProfileRequest,
  RefreshTokenRequest,
} from "@tenio/shared";

/** 账号密码登录请求体 */
export type PasswordLoginPayload = PasswordLoginRequest;
/** 短信验证码登录请求体 */
export type SmsLoginPayload = SmsLoginRequest;
/** 首次登录用户资料设置请求体 */
export type SetupProfilePayload = SetupProfileRequest;
/** Token 刷新请求体 */
export type RefreshTokenPayload = RefreshTokenRequest;
