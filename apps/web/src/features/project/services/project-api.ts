import { API_BASE } from "@/config";
import { buildUrl, request } from "@/services/http";
import type {
  ApiListResponse,
  CrewPlanArtifact,
  DocumentArtifact,
  GenerationStatus,
  OperationStatus,
  ProjectListItem,
  ProjectListParams,
  ProjectMetrics,
  RegeneratePayload,
  ScheduleArtifact,
  StartGenerationPayload,
  StartGenerationResponse,
  TimeCostArtifact,
  WorkbenchUploadSummary,
} from "../types";

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

// ============================================================================
// 项目列表与基础信息
// ============================================================================

/**
 * 获取项目统计指标。
 *
 * @returns 项目控制台统计指标
 */
export function getProjectMetrics(): Promise<ProjectMetrics> {
  return request<ProjectMetrics>(`${APM_API_BASE}/projects/metrics`);
}

/**
 * 获取项目列表。
 *
 * @param params - 项目列表筛选和分页参数
 * @returns 项目列表和分页信息
 */
export async function getProjectList(
  params: ProjectListParams = {},
): Promise<ApiListResponse<ProjectListItem>> {
  const url = buildUrl(APM_API_BASE, "/projects", {
    status: params.status ?? "",
    q: params.keyword ?? "",
    page: params.page == null ? "" : String(params.page),
    page_size: params.page_size == null ? "" : String(params.page_size),
  });
  return request<ApiListResponse<ProjectListItem>>(url);
}

/**
 * 获取最新 graph 产物。
 *
 * @param projectId - 项目 ID
 * @returns 最新 graph 产物
 */
export function getLatestGraphArtifact(projectId: string): Promise<ScheduleArtifact> {
  return request<ScheduleArtifact>(`${APM_API_BASE}/projects/${projectId}/artifacts/graph/latest`);
}

/**
 * 获取最新施工组织设计文档产物。
 *
 * @param projectId - 项目 ID
 * @returns 最新施工组织设计文档产物
 */
export function getLatestDocumentArtifact(projectId: string): Promise<DocumentArtifact> {
  return request<DocumentArtifact>(
    `${APM_API_BASE}/projects/${projectId}/artifacts/document/latest`,
  );
}

/**
 * 获取最新工期成本分析产物。
 *
 * @param projectId - 项目 ID
 * @returns 最新工期成本分析产物
 */
export function getLatestTimeCostArtifact(projectId: string): Promise<TimeCostArtifact> {
  return request<TimeCostArtifact>(
    `${APM_API_BASE}/projects/${projectId}/artifacts/time-cost/latest`,
  );
}

/**
 * 获取最新人员轮转产物。
 *
 * @param projectId - 项目 ID
 * @returns 最新人员轮转产物
 */
export function getLatestCrewPlanArtifact(projectId: string): Promise<CrewPlanArtifact> {
  return request<CrewPlanArtifact>(
    `${APM_API_BASE}/projects/${projectId}/artifacts/crew-plan/latest`,
  );
}

/**
 * 启动项目产物生成。
 *
 * @param projectId - 项目 ID
 * @param payload - 启动生成参数
 * @returns 生成任务状态
 */
export function startProjectGeneration(
  projectId: string,
  payload: StartGenerationPayload = {},
): Promise<StartGenerationResponse> {
  return jsonRequest<StartGenerationResponse>(`/projects/${projectId}/generation/start`, payload);
}

/**
 * 取消项目生成任务。
 *
 * @param projectId - 项目 ID
 */
export function cancelProjectGeneration(projectId: string): Promise<void> {
  return jsonRequest<unknown>(`/projects/${projectId}/generation/cancel`).then(() => undefined);
}

/**
 * 删除项目。
 *
 * @param projectId - 项目 ID
 */
export function deleteProject(projectId: string): Promise<void> {
  return request<unknown>(`${APM_API_BASE}/projects/${projectId}`, {
    method: "DELETE",
  }).then(() => undefined);
}

/**
 * 重新生成指定项目产物。
 *
 * @param projectId - 项目 ID
 * @param payload - 重新生成参数
 * @returns 生成任务状态
 */
export function regenerateProjectArtifacts(
  projectId: string,
  payload: RegeneratePayload = {},
): Promise<StartGenerationResponse> {
  return jsonRequest<StartGenerationResponse>(
    `/projects/${projectId}/generation/regenerate`,
    payload,
  );
}

/**
 * 获取项目生成状态。
 *
 * @param projectId - 项目 ID
 * @returns 当前生成状态
 */
export function getProjectGenerationStatus(projectId: string): Promise<GenerationStatus> {
  return request<GenerationStatus>(`${APM_API_BASE}/projects/${projectId}/generation/status`);
}

/**
 * 获取项目正式动作状态。
 *
 * @param projectId - 项目 ID
 * @param operationId - 操作 ID
 * @returns 操作状态
 */
export function getProjectOperationStatus(
  projectId: string,
  operationId: string,
): Promise<OperationStatus> {
  return request<OperationStatus>(
    `${APM_API_BASE}/projects/${projectId}/operations/${operationId}`,
  );
}

/**
 * 获取工作台上传文件页签汇总。
 *
 * @param projectId - 项目 ID
 * @returns 上传文件页签数据
 */
export function getWorkbenchUploadSummary(projectId: string): Promise<WorkbenchUploadSummary> {
  return request<WorkbenchUploadSummary>(
    `${APM_API_BASE}/projects/${projectId}/workbench/upload-summary`,
  );
}
