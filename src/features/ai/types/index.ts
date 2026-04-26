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
