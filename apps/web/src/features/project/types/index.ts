// ============================================================================
// API 响应类型
// ============================================================================

import type { Project, ProjectStatus } from "@tenio/shared";

export type { ProjectStatus } from "@tenio/shared";

export type ApiListResponse<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

export interface ProjectListParams {
  status?: ProjectStatus;
  keyword?: string;
  page?: number;
  page_size?: number;
}

export interface ProjectCreatePayload {
  name?: string | null;
  source_type?: string;
}

export type ProjectCreateResponse = Project;

export interface MockProjectCreatePayload {
  mock_dataset_code: string;
  name?: string | null;
  original_name?: string | null;
  file_extension?: string | null;
  size_bytes?: number | null;
}

export interface ProjectMetrics {
  total_count: number;
  in_progress_count: number;
  ready_artifact_count: number;
  average_generation_seconds: number;
  managed_count: number;
}

export interface ProjectListItem extends Project {
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
  status_label?: string;
  planned_start_date?: string;
  planned_finish_date?: string;
  actual_finish_date?: string | null;
  remaining_days?: number;
  is_artifact_ready?: boolean;
}

export type ProjectDetail = ProjectListItem & Record<string, unknown>;

export interface ArtifactBase {
  id?: string;
  project_id?: string;
  type: string;
  version?: number;
  status: string;
  is_latest_version?: boolean;
  generated_at?: string;
  scheme_id?: string;
  process_version_id?: string;
}

export interface ScheduleTask {
  taskId: string;
  seqNo: number;
  taskName: string;
  crewTypeName: string;
  crewCount: number;
  durationDays: number;
  startTime: string;
  endTime: string;
  dependencies: Array<string | number>;
  taskStatus?: string;
  indentLevel?: number;
  isSummaryTask?: boolean;
  isCriticalPath: boolean;
}

export interface ScheduleArtifact extends ArtifactBase {
  type: "schedule" | string;
  graph: ScheduleTask[];
  resource_pool?: Record<string, number>;
  version_summary?: {
    total_duration_days?: number;
    planned_start_date?: string;
    planned_finish_date?: string;
    task_count?: number;
    critical_task_count?: number;
    resource_pool?: Record<string, number>;
  };
  compression_summary?: Array<Record<string, unknown>>;
  summary?: {
    task_count?: number;
    critical_task_count?: number;
    planned_start_date?: string;
    planned_finish_date?: string;
    total_duration_days?: number;
  };
}

export interface DocumentTocItem {
  order_no: number;
  title: string;
}

export interface DocumentArtifact extends ArtifactBase {
  type: "document" | string;
  document_title: string;
  chapter_count: number;
  word_count: number;
  can_edit: boolean;
  toc_items?: DocumentTocItem[];
  content_markdown: string;
}

export interface CrewPlanTask {
  crew_task_id: string;
  task_name: string;
  work_location: string;
  start_label: string;
  end_label: string;
  duration_label: string;
  start_date: string;
  end_date: string;
}

export interface CrewPlanCrew {
  crew_id: string;
  crew_name: string;
  task_count: number;
  total_work_days: number;
  crew_status: string;
  tasks: CrewPlanTask[];
}

export interface CrewPlanGroup {
  crew_type_code: string;
  crew_type_name: string;
  color_hex: string;
  crew_count: number;
  crews: CrewPlanCrew[];
}

export interface CrewPlanArtifact extends ArtifactBase {
  type: "crew_plan" | string;
  crew_types: CrewPlanGroup[];
  summary: {
    crew_type_count: number;
    crew_count: number;
    crew_task_count: number;
    planned_start_date: string;
    planned_finish_date: string;
  };
}

export interface TimeCostArtifact extends ArtifactBase {
  type: "time_cost" | string;
  scheme_id?: string | null;
  process_version_id?: string | null;
  contract_duration_days: number;
  optimal_duration_days: number;
  minimum_total_cost_cents: number;
  saving_rate_percent: number | null;
  recommendation: TimeCostRecommendation;
  options: TimeCostOption[];
  curve: TimeCostCurve;
}

export interface TimeCostRecommendation {
  recommended_duration_days: number;
  recommended_min_duration_days: number;
  recommended_max_duration_days: number;
  saving_amount_cents: number | null;
  recommendation_text: string;
}

export interface TimeCostOption {
  option_id: string;
  duration_days: number;
  direct_cost_cents: number;
  rental_cost_cents: number;
  manage_cost_cents: number;
  machine_cost_cents: number;
  indirect_cost_cents: number;
  total_cost_cents: number;
  total_crew_count: number;
  resource_pool: Record<string, number>;
  is_recommended: boolean;
}

export interface TimeCostCurve {
  best_schema_id: string;
  schema_ids: number[];
  cost: number[];
  direct_cost: number[];
  indirect_cost: number[];
}

export interface StartGenerationPayload {
  trigger_source?: string;
}

export interface StartGenerationResponse {
  id: string;
  project_id: string;
  status: string;
  progress_percent: number;
  started_at: string | null;
}

export interface RegeneratePayload {
  types?: string[] | null;
  reason?: string | null;
}

export interface GenerationStep {
  code: string;
  name: string;
  order: number;
  status: string;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface GenerationStatus {
  id: string;
  project_id: string;
  status: string;
  progress_percent: number;
  current_step?: GenerationStep | null;
  started_at: string | null;
  finished_at?: string | null;
  steps: GenerationStep[];
  error?: { code: string; message: string } | null;
}

export interface OperationStatus {
  id: string;
  status?: string;
  project_id?: string;
  error_code?: string | null;
  error_message?: string | null;
  [key: string]: unknown;
}

export interface WorkbenchProjectInfo {
  name?: string | null;
  project_subtitle?: string | null;
  location?: string | null;
  building_area_sqm?: number | null;
  contract_duration_days?: number | null;
  quality_standard?: string | null;
  contract_amount_cents?: number | null;
  control_amount_cents?: number | null;
  employer_name?: string | null;
  employer_contact_name?: string | null;
  qualification_requirement_text?: string | null;
  funding_source?: string | null;
  bid_evaluation_method?: string | null;
}

export interface WorkbenchUploadSummary {
  project_info?: WorkbenchProjectInfo | null;
  [key: string]: unknown;
}

export interface WorkbenchConsoleLog {
  [key: string]: unknown;
}

export interface ProjectScheme {
  scheme_id: string;
  scheme_name?: string;
  is_active?: boolean;
  [key: string]: unknown;
}
