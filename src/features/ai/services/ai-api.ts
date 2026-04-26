import { API_BASE } from "@/config";
import { buildUrl, request, requestSse, type SseRequestOptions } from "@/services/http";

type ApiListResponse<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

export interface AgentTicketPayload {
  product_code: "apm" | string;
  project_id: string;
  grant_type: "project_agent_access" | string;
}

export interface AgentTicketResponse {
  agent_ticket: string;
  ticket_type: string;
  expires_at: string;
  refresh_after_seconds: number;
  scopes: string[];
  agent_base_url: string;
}

export interface AgentInitPayload {
  product_code: "apm" | string;
  project_id: string;
  agent_ticket: string;
}

export interface AgentInitResponse {
  chat_session_id: string;
  is_new_session: boolean;
}

export interface AgentSessionListParams {
  product_code: "apm" | string;
  project_id: string;
}

export interface AgentSessionItem {
  chat_session_id: string;
  session_title: string;
  last_message_at: string;
}

export interface AgentMessageItem {
  message_id: string;
  message_role: string;
  message_type: string;
  content_text: string;
  sent_at: string;
}

export interface AgentSessionMessages {
  chat_session_id: string;
  messages: AgentMessageItem[];
}

export interface SendAgentMessagePayload {
  content_text: string;
}

const APM_API_BASE = `${API_BASE.backend}/api`;

function jsonRequest<T>(path: string, payload?: unknown) {
  return request<T>(`${APM_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload == null ? undefined : JSON.stringify(payload),
  });
}

function agentApiBase(agentBaseUrl?: string) {
  return `${(agentBaseUrl ?? API_BASE.aiService).replace(/\/$/, "")}/api`;
}

/**
 * 从 APM 后端签发 agent-service 访问票据。
 */
export function issueAgentTicket(payload: AgentTicketPayload): Promise<AgentTicketResponse> {
  return jsonRequest<AgentTicketResponse>("/agent/tickets", payload);
}

/**
 * 初始化 agent-service 会话。
 */
export function initAgentSession(
  payload: AgentInitPayload,
  options: { agentBaseUrl?: string } = {},
): Promise<AgentInitResponse> {
  return request<AgentInitResponse>(`${agentApiBase(options.agentBaseUrl)}/agent/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/**
 * 获取 agent-service 会话列表。
 */
export function listAgentSessions(
  params: AgentSessionListParams,
  options: { agentBaseUrl?: string } = {},
): Promise<ApiListResponse<AgentSessionItem>> {
  const url = buildUrl(agentApiBase(options.agentBaseUrl), "/agent/sessions", {
    product_code: params.product_code,
    project_id: params.project_id,
  });
  return request<ApiListResponse<AgentSessionItem>>(url);
}

/**
 * 获取 agent-service 会话消息。
 */
export function getAgentSessionMessages(
  chatSessionId: string,
  options: { agentBaseUrl?: string } = {},
): Promise<AgentSessionMessages> {
  return request<AgentSessionMessages>(
    `${agentApiBase(options.agentBaseUrl)}/agent/sessions/${chatSessionId}/messages`,
  );
}

/**
 * 向 agent-service 发送用户消息。
 */
export function sendAgentSessionMessage(
  chatSessionId: string,
  payload: SendAgentMessagePayload,
  options: { agentBaseUrl?: string } = {},
): Promise<AgentMessageItem> {
  return request<AgentMessageItem>(
    `${agentApiBase(options.agentBaseUrl)}/agent/sessions/${chatSessionId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

/**
 * 订阅 agent-service 会话 SSE 输出。
 */
export function subscribeAgentSessionSse(
  chatSessionId: string,
  options: Pick<SseRequestOptions, "signal" | "onMessage" | "onDone" | "onError"> & {
    agentBaseUrl?: string;
  } = {},
): Promise<Response> {
  return requestSse(`${agentApiBase(options.agentBaseUrl)}/agent/sessions/${chatSessionId}/sse`, {
    method: "GET",
    signal: options.signal,
    onMessage: options.onMessage,
    onDone: options.onDone,
    onError: options.onError,
  });
}
