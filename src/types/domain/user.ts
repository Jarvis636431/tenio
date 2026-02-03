export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  user_id: string;
  username: string;
  role?: string;
  projects?: string[];
}
