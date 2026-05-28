export interface CreateAgentSessionRequest {
  session_title?: string;
}

export interface CreateAgentSessionResponse {
  current_session: AgentSession;
}

export interface AgentSession {
  id: string;
  title: string;
  status: string;
  last_message_at: string | null;
}

export interface AgentSessionListResponse {
  items: AgentSession[];
  total: number;
  page?: number;
  page_size?: number;
}

export interface AgentMessage {
  id: string;
  role: string;
  type: string;
  content: string;
  sent_at: string;
}

export interface AgentSessionMessagesResponse {
  session_id: string;
  messages: AgentMessage[];
}

export interface SendAgentMessageRequest {
  content: string;
}

export interface SendAgentMessageResponse extends AgentMessage {
  stream_id: string;
}

export interface AgentOperationStatusResponse {
  id: string;
  project_id: string;
  status: string;
  error_code?: string | null;
  error_message?: string | null;
}

export interface AgentToolDescriptor {
  id: string;
  name: string;
  description: string;
  capability: "read" | "write";
  requires_approval: boolean;
}

export interface AgentToolListResponse {
  items: AgentToolDescriptor[];
}

export interface AgentStreamEvent {
  type: string;
  content?: string;
  operation_id?: string;
  types?: string[];
  data?: unknown;
}
