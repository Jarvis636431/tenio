export { useAuth } from "./hooks/useAuth";
export { useSmsCooldown } from "./hooks/useSmsCooldown";
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
export { Login } from "./pages/Login";
export { AuthDialog, FormField, FormInput, SMSButton, SMSInput } from "./components";
export {
  accountLoginSchema,
  phoneLoginSchema,
  registerSchema,
  profileSchema,
  phoneSchema,
  smsCodeSchema,
} from "./schemas/auth-schemas";
export type {
  AccountLoginFormData,
  PhoneLoginFormData,
  RegisterFormData,
  ProfileFormData,
  PhoneFormData,
  SmsCodeFormData,
} from "./schemas/auth-schemas";
