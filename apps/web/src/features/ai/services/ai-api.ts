import { API_BASE } from "@/config";
import { buildUrl, request, requestSse, type SseRequestOptions } from "@/services/http";

export interface CreateAgentSessionRequest {
  session_title?: string;
}

export interface AgentSessionItem {
  id: string;
  title: string;
  status: string;
  last_message_at: string | null;
}

export interface CreateAgentSessionResponse {
  current_session: AgentSessionItem;
}

export interface AgentSessionListResponse {
  items: AgentSessionItem[];
  total: number;
  page?: number;
  page_size?: number;
}

export interface AgentMessageItem {
  id: string;
  role: string;
  type: string;
  content: string;
  sent_at: string;
}

export interface AgentSessionMessagesResponse {
  session_id: string;
  messages: AgentMessageItem[];
}

export interface SendAgentMessageRequest {
  content: string;
}

export interface SendAgentMessageResponse extends AgentMessageItem {
  stream_id: string;
}

export interface AgentOperationStatusResponse {
  id: string;
  project_id: string;
  status: string;
  error_code?: string | null;
  error_message?: string | null;
}

interface AgentSessionListParams {
  session_status?: string;
}

const APM_API_BASE = `${API_BASE.backend}/api`;

/**
 * 创建项目下的 agent 会话。
 */
export function createAgentSession(
  projectId: string,
  payload: CreateAgentSessionRequest = {},
): Promise<CreateAgentSessionResponse> {
  return request<CreateAgentSessionResponse>(
    `${APM_API_BASE}/projects/${projectId}/agent/sessions`,
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
 * 获取项目下的 agent 会话列表。
 */
export function listAgentSessions(
  projectId: string,
  params: AgentSessionListParams = {},
): Promise<AgentSessionListResponse> {
  const url = buildUrl(APM_API_BASE, `/projects/${projectId}/agent/sessions`, {
    ...(params.session_status ? { session_status: params.session_status } : {}),
  });
  return request<AgentSessionListResponse>(url);
}

/**
 * 获取指定 agent 会话的历史消息。
 */
export function getAgentSessionMessages(
  projectId: string,
  chatSessionId: string,
): Promise<AgentSessionMessagesResponse> {
  return request<AgentSessionMessagesResponse>(
    `${APM_API_BASE}/projects/${projectId}/agent/sessions/${chatSessionId}/messages`,
  );
}

/**
 * 向指定会话发送用户消息。
 */
export function sendAgentSessionMessage(
  projectId: string,
  chatSessionId: string,
  payload: SendAgentMessageRequest,
): Promise<SendAgentMessageResponse> {
  return request<SendAgentMessageResponse>(
    `${APM_API_BASE}/projects/${projectId}/agent/sessions/${chatSessionId}/messages`,
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
 * 订阅指定项目会话的流式输出。
 */
export function subscribeAgentStreamSse(
  projectId: string,
  streamId: string,
  options: Pick<SseRequestOptions, "signal" | "onMessage" | "onDone" | "onError"> = {},
): Promise<Response> {
  return requestSse(`${APM_API_BASE}/projects/${projectId}/agent/streams/${streamId}/sse`, {
    method: "GET",
    signal: options.signal,
    onMessage: options.onMessage,
    onDone: options.onDone,
    onError: options.onError,
  });
}

/**
 * 获取项目操作状态。
 */
export function getAgentOperationStatus(
  projectId: string,
  operationId: string,
): Promise<AgentOperationStatusResponse> {
  return request<AgentOperationStatusResponse>(
    `${APM_API_BASE}/projects/${projectId}/operations/${operationId}`,
  );
}
