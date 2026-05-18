export interface CreateAgentSessionRequest {
  session_title?: string;
}

export interface CreateAgentSessionResponse {
  current_session: AgentSession;
}

export interface AgentSession {
  chat_session_id: string;
  session_title: string;
  session_status: string;
  last_message_at: string | null;
}

export interface AgentSessionListResponse {
  items: AgentSession[];
  total: number;
  page?: number;
  page_size?: number;
}

export interface AgentMessage {
  message_id: string;
  message_role: string;
  message_type: string;
  content_text: string;
  sent_at: string;
}

export interface AgentSessionMessagesResponse {
  chat_session_id: string;
  messages: AgentMessage[];
}

export interface SendAgentMessageRequest {
  content_text: string;
}

export interface SendAgentMessageResponse extends AgentMessage {
  stream_id: string;
}

export interface AgentOperationStatusResponse {
  operation_id: string;
  project_id: string;
  operation_status: string;
  error_code?: string | null;
  error_message?: string | null;
}

export interface AgentStreamEvent {
  type: string;
  content_text?: string;
  message_type?: string;
  operation_id?: string;
  artifact_types?: string[];
  data?: unknown;
}
