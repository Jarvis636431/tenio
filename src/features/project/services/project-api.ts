import { API_BASE } from "@/config";
import { buildUrl, request } from "@/services/http";
import type {
  ApiListResponse,
  GenerationStatus,
  ProjectListItem,
  ProjectListParams,
  ProjectMetrics,
  ScheduleArtifact,
  StartGenerationPayload,
  StartGenerationResponse,
  TimeCostArtifact,
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
    keyword: params.keyword ?? "",
    page: params.page == null ? "" : String(params.page),
    page_size: params.page_size == null ? "" : String(params.page_size),
  });
  return request<ApiListResponse<ProjectListItem>>(url);
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
 * 获取最新工期成本分析产物。
 */
export function getLatestTimeCostArtifact(projectId: string): Promise<TimeCostArtifact> {
  return request<TimeCostArtifact>(
    `${APM_API_BASE}/projects/${projectId}/artifacts/time-cost/latest`,
  );
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
