export interface Project {
  id: string;
  name: string;
  // 可编辑基础信息字段
  city?: string;
  buildingType?: string;
  structureType?: string;
  bidAmount?: number;
  controlPrice?: number;
  buildingHeight?: number;
  buildingFloors?: number;
  buildingArea?: number;
  status?: string;
  createdAt?: string;
  description?: string;
}

// ============================================================================
// API 响应类型
// ============================================================================

export type ApiListResponse<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

export interface ProjectListItem {
  project_id: string;
  project_name: string;
  description?: string;
  status: string;
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
  options: TimeCostOption[];
}

export interface TimeCostOption {
  option_name?: string;
  duration_days?: number;
  total_cost_cents?: number;
  total_cost?: number;
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
