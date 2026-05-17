export interface AgentTicketRequest {
  project_id: string;
  product_code?: "apm" | string;
  grant_type?: "project_agent_access" | string;
}

export interface AgentTicketResponse {
  agent_ticket: string;
  ticket_type: string;
  expires_at: string;
  refresh_after_seconds: number;
  scopes: string[];
  agent_base_url: string;
}

export interface AgentInitRequest {
  product_code: "apm" | string;
  project_id: string;
  agent_ticket: string;
}

export interface AgentInitResponse {
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
