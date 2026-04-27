export interface AuthUser {
  user_id: string;
  username: string;
  display_name: string;
  role: string;
  role_name: string;
  avatar_text: string;
  account?: string;
  is_profile_completed?: boolean;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user: AuthUser;
}

export interface SendSmsResponse {
  phone: string;
  cooldown_seconds: number;
  sent_at: string;
}

export interface SmsLoginPayload {
  phone: string;
  sms_code: string;
  has_agreed_terms: boolean;
}

export interface PasswordLoginPayload {
  account: string;
  password: string;
  has_agreed_terms: boolean;
}

export interface SetupProfilePayload {
  username: string;
  password: string;
}

export interface SetupProfileResponse {
  user_id: string;
  username: string;
  account: string;
  is_profile_completed: boolean;
}
