import { API_BASE } from "@/config";
import { request } from "@/services/http";
import type { Project } from "@/features/project";

export type ApiListResponse<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

export interface ProjectListItem {
  project_id: string;
  project_name: string;
  short_name?: string;
  location?: string;
  project_type?: string;
  building_area_sqm?: number;
  contract_duration_days?: number;
  contract_amount_cents?: number;
  contract_amount_display?: string;
  ready_artifact_count?: number;
  progress_percent?: number;
  current_phase?: string;
  status: string;
  status_label?: string;
  planned_start_date?: string;
  planned_finish_date?: string;
  actual_finish_date?: string | null;
  remaining_days?: number;
  is_artifact_ready?: boolean;
  created_at: string;
}

export interface ArtifactBase {
  artifact_id: string;
  artifact_type: string;
  artifact_version: number;
  artifact_status: string;
  is_latest_version?: boolean;
  generated_at?: string;
}

export interface ScheduleTask {
  task_id: string;
  sequence_no: number;
  task_name: string;
  crew_type_name?: string;
  crew_count?: number;
  duration_days: number;
  start_date: string;
  end_date: string;
  predecessor_task_ids: string[];
  predecessor_display?: string;
  task_status: string;
  indent_level: number;
  is_summary_task: boolean;
  is_critical_task: boolean;
}

export interface ScheduleArtifact extends ArtifactBase {
  artifact_type: "graph" | string;
  total_duration_days: number;
  task_count: number;
  critical_task_count: number;
  tasks: ScheduleTask[];
}

export interface TimeCostArtifact extends ArtifactBase {
  artifact_type: "time_cost" | string;
  contract_duration_days: number;
  optimal_duration_days: number;
  minimum_total_cost_cents: number;
  saving_rate_percent: number;
  recommendation: Record<string, unknown>;
  options: Array<Record<string, unknown>>;
}

export interface StartGenerationPayload {
  trigger_source?: string;
}

export interface StartGenerationResponse {
  generation_job_id: string;
  generation_status: string;
  started_at: string;
}

export interface GenerationStep {
  step_code: string;
  step_name: string;
  step_order: number;
  step_status: string;
  step_started_at?: string | null;
  step_finished_at?: string | null;
}

export interface GenerationStatus {
  generation_job_id: string;
  project_id: string;
  generation_status: string;
  current_step_code: string;
  current_step_name: string;
  step_progress_percent: number;
  started_at: string;
  finished_at?: string | null;
  steps: GenerationStep[];
  error_code?: string | null;
  error_message?: string | null;
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

// ============================================================================
// 项目列表与基础信息
// ============================================================================

function toProject(item: ProjectListItem): Project {
  return {
    id: item.project_id,
    name: item.project_name,
    description: item.location ?? item.project_type ?? item.status_label,
    status: item.status,
    createdAt: item.created_at,
  };
}

/**
 * 获取项目列表。
 */
export async function getProjectList(): Promise<Project[]> {
  const response = await request<ApiListResponse<ProjectListItem>>(`${APM_API_BASE}/projects`);
  return response.items.map(toProject);
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
