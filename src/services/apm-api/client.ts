import { API_BASE } from "@/config";
import { buildUrl, request, requestSse, type SseRequestOptions } from "@/services/http";
import type {
  ActivateSchemeResponse,
  AgentInitPayload,
  AgentInitResponse,
  AgentMessageItem,
  AgentSessionItem,
  AgentSessionListParams,
  AgentSessionMessages,
  AgentTicketPayload,
  AgentTicketResponse,
  ApiListResponse,
  AuthTokenResponse,
  CompleteUploadPayload,
  CreateProjectPayload,
  CreateProjectResponse,
  CrewPlanArtifact,
  DocumentArtifact,
  ExportAllResponse,
  GanttArtifact,
  GenerationStatus,
  NetworkArtifact,
  PasswordLoginPayload,
  ProjectDetail,
  ProjectFileItem,
  ProjectListItem,
  ProjectListParams,
  ProjectMetrics,
  ProjectOperation,
  ProjectScheme,
  RegenerateResponse,
  ScheduleArtifact,
  SendAgentMessagePayload,
  SendSmsCodePayload,
  SendSmsCodeResponse,
  SetupProfilePayload,
  SetupProfileResponse,
  SmsLoginPayload,
  StartGenerationPayload,
  StartGenerationResponse,
  TimeCostArtifact,
  UploadInitPayload,
  UploadInitResponse,
  UploadSummary,
  UserProfile,
} from "./types";

const APM_API_BASE = `${API_BASE.backend}/api`;

function jsonRequest<T>(path: string, payload?: unknown, method: "POST" | "PATCH" = "POST") {
  return request<T>(`${APM_API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: payload == null ? undefined : JSON.stringify(payload),
  });
}

function agentApiBase(agentBaseUrl?: string) {
  return `${(agentBaseUrl ?? API_BASE.aiService).replace(/\/$/, "")}/api`;
}

// ============================================================================
// Auth
// ============================================================================

/**
 * 发送短信验证码。
 */
export function sendSmsCode(payload: SendSmsCodePayload): Promise<SendSmsCodeResponse> {
  return jsonRequest<SendSmsCodeResponse>("/auth/sms/send", payload);
}

/**
 * 使用手机号和短信验证码登录。
 */
export function loginWithSms(payload: SmsLoginPayload): Promise<AuthTokenResponse> {
  return jsonRequest<AuthTokenResponse>("/auth/login/sms", payload);
}

/**
 * 使用账号和密码登录。
 */
export function loginWithPassword(payload: PasswordLoginPayload): Promise<AuthTokenResponse> {
  return jsonRequest<AuthTokenResponse>("/auth/login/password", payload);
}

/**
 * 首次短信登录后设置用户展示名和密码。
 */
export function setupProfile(payload: SetupProfilePayload): Promise<SetupProfileResponse> {
  return jsonRequest<SetupProfileResponse>("/auth/setup-profile", payload);
}

/**
 * 获取当前登录用户信息。
 */
export function getCurrentUser(): Promise<UserProfile> {
  return request<UserProfile>(`${APM_API_BASE}/me`);
}

// ============================================================================
// Projects
// ============================================================================

/**
 * 获取项目控制台统计指标。
 */
export function getProjectMetrics(): Promise<ProjectMetrics> {
  return request<ProjectMetrics>(`${APM_API_BASE}/projects/metrics`);
}

/**
 * 获取项目列表。
 */
export function listProjects(
  params: ProjectListParams = {},
): Promise<ApiListResponse<ProjectListItem>> {
  const url = buildUrl(APM_API_BASE, "/projects", {
    status: params.status ?? "",
    keyword: params.keyword ?? "",
    page: params.page ? String(params.page) : "",
    page_size: params.page_size ? String(params.page_size) : "",
  });
  return request<ApiListResponse<ProjectListItem>>(url);
}

/**
 * 创建新项目。
 */
export function createProject(payload: CreateProjectPayload = {}): Promise<CreateProjectResponse> {
  return jsonRequest<CreateProjectResponse>("/projects", payload);
}

/**
 * 获取项目详情。
 */
export function getProjectDetail(projectId: string): Promise<ProjectDetail> {
  return request<ProjectDetail>(`${APM_API_BASE}/projects/${projectId}`);
}

// ============================================================================
// Uploads and Generation
// ============================================================================

/**
 * 获取项目文件上传凭证。
 */
export function initProjectFileUpload(
  projectId: string,
  payload: UploadInitPayload,
): Promise<UploadInitResponse> {
  return jsonRequest<UploadInitResponse>(`/projects/${projectId}/files/upload-init`, payload);
}

/**
 * 通知后端文件上传已完成。
 */
export function completeProjectFileUpload(
  projectId: string,
  payload: CompleteUploadPayload,
): Promise<void> {
  return jsonRequest<void>(`/projects/${projectId}/files/complete`, payload);
}

/**
 * 获取项目文件列表。
 */
export function listProjectFiles(projectId: string): Promise<ApiListResponse<ProjectFileItem>> {
  return request<ApiListResponse<ProjectFileItem>>(`${APM_API_BASE}/projects/${projectId}/files`);
}

/**
 * 删除项目文件。
 */
export async function deleteProjectFile(projectId: string, fileId: string): Promise<void> {
  await request<void>(`${APM_API_BASE}/projects/${projectId}/files/${fileId}`, {
    method: "DELETE",
  });
}

/**
 * 启动项目产物生成。
 */
export function startProjectGeneration(
  projectId: string,
  payload: StartGenerationPayload = {},
): Promise<StartGenerationResponse> {
  return jsonRequest<StartGenerationResponse>(`/projects/${projectId}/generation/start`, payload);
}

/**
 * 获取项目生成状态。
 */
export function getProjectGenerationStatus(projectId: string): Promise<GenerationStatus> {
  return request<GenerationStatus>(`${APM_API_BASE}/projects/${projectId}/generation/status`);
}

/**
 * 重新生成项目产物。
 */
export function regenerateProject(projectId: string): Promise<RegenerateResponse> {
  return jsonRequest<RegenerateResponse>(`/projects/${projectId}/generation/regenerate`);
}

/**
 * 导出项目全部产物。
 */
export function exportAllProjectArtifacts(projectId: string): Promise<ExportAllResponse> {
  return jsonRequest<ExportAllResponse>(`/projects/${projectId}/export/all`);
}

// ============================================================================
// Workbench Artifacts
// ============================================================================

/**
 * 获取工作台上传文件页签摘要。
 */
export function getUploadSummary(projectId: string): Promise<UploadSummary> {
  return request<UploadSummary>(`${APM_API_BASE}/projects/${projectId}/workbench/upload-summary`);
}

/**
 * 获取最新施工组织设计文档。
 */
export function getLatestDocumentArtifact(projectId: string): Promise<DocumentArtifact> {
  return request<DocumentArtifact>(
    `${APM_API_BASE}/projects/${projectId}/artifacts/document/latest`,
  );
}

/**
 * 获取最新进度计划产物。
 */
export function getLatestScheduleArtifact(projectId: string): Promise<ScheduleArtifact> {
  return request<ScheduleArtifact>(
    `${APM_API_BASE}/projects/${projectId}/artifacts/schedule/latest`,
  );
}

/**
 * 获取最新甘特图产物。
 */
export function getLatestGanttArtifact(projectId: string): Promise<GanttArtifact> {
  return request<GanttArtifact>(`${APM_API_BASE}/projects/${projectId}/artifacts/gantt/latest`);
}

/**
 * 获取最新网络图产物。
 */
export function getLatestNetworkArtifact(projectId: string): Promise<NetworkArtifact> {
  return request<NetworkArtifact>(`${APM_API_BASE}/projects/${projectId}/artifacts/network/latest`);
}

/**
 * 获取最新工期成本分析产物。
 */
export function getLatestTimeCostArtifact(projectId: string): Promise<TimeCostArtifact> {
  return request<TimeCostArtifact>(
    `${APM_API_BASE}/projects/${projectId}/artifacts/time-cost/latest`,
  );
}

/**
 * 获取最新人员轮转产物。
 */
export function getLatestCrewPlanArtifact(projectId: string): Promise<CrewPlanArtifact> {
  return request<CrewPlanArtifact>(
    `${APM_API_BASE}/projects/${projectId}/artifacts/crew-plan/latest`,
  );
}

// ============================================================================
// Agent and Project Actions
// ============================================================================

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

/**
 * 获取项目施工方案列表。
 */
export function listProjectSchemes(projectId: string): Promise<ApiListResponse<ProjectScheme>> {
  return request<ApiListResponse<ProjectScheme>>(`${APM_API_BASE}/projects/${projectId}/schemes`);
}

/**
 * 激活项目施工方案。
 */
export function activateProjectScheme(
  projectId: string,
  schemeId: string,
): Promise<ActivateSchemeResponse> {
  return jsonRequest<ActivateSchemeResponse>(`/projects/${projectId}/schemes/${schemeId}/activate`);
}

/**
 * 查询项目正式动作状态。
 */
export function getProjectOperation(
  projectId: string,
  operationId: string,
): Promise<ProjectOperation> {
  return request<ProjectOperation>(
    `${APM_API_BASE}/projects/${projectId}/operations/${operationId}`,
  );
}
