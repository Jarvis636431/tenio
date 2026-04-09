export interface AgentInitPayload {
  project_id: string;
  base_date: string;
  solution_id: number;
  access_token?: string;
  base_url?: string;
}

export interface AgentInitResponse {
  message?: string;
  [key: string]: unknown;
}

export interface AgentResumePayload {
  message: string;
  thread_id: string;
  approved: boolean;
}

export interface AgentResumeResponse {
  message?: string;
  [key: string]: unknown;
}

export interface AgentChatPayload {
  message: string;
  thread_id: string | null;
}

export type AgentChatMessageHandler = (content: string, payload: unknown) => void;
