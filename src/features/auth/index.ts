export { useAuth } from "./hooks/useAuth";
export {
  getCurrentUser,
  loginWithPassword,
  loginWithSms,
  sendLoginSms,
  setupProfile,
} from "./services/auth-api";
export type {
  AuthSession,
  AuthUser,
  PasswordLoginPayload,
  SendSmsResponse,
  SetupProfilePayload,
  SetupProfileResponse,
  SmsLoginPayload,
} from "./types";
