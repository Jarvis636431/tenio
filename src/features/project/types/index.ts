// ============================================================================
// API 响应类型
// ============================================================================

export type ApiListResponse<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

export interface ProjectListParams {
  status?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}

export interface ProjectCreatePayload {
  project_name?: string | null;
  source_type?: string;
}

export interface ProjectCreateResponse {
  project_id: string;
  project_name: string;
  status: string;
  created_at: string;
}

export interface MockProjectCreatePayload {
  mock_dataset_code: string;
  project_name?: string | null;
  original_file_name?: string | null;
  file_extension?: string | null;
  file_size_bytes?: number | null;
}

export interface ProjectMetrics {
  total_count: number;
  in_progress_count: number;
  ready_artifact_count: number;
  average_generation_seconds: number;
  managed_count: number;
}

export interface ProjectListItem {
  project_id: string;
  project_name: string;
  short_name: string;
  location: string;
  project_type: string;
  building_area_sqm: number;
  contract_duration_days: number;
  contract_amount_cents: number;
  contract_amount_display: string;
  ready_artifact_count: number;
  progress_percent: number;
  current_phase: string;
  status: string;
  status_label: string;
  planned_start_date: string;
  planned_finish_date: string;
  actual_finish_date: string | null;
  remaining_days: number;
  is_artifact_ready: boolean;
  created_at: string;
}

export type ProjectDetail = ProjectListItem & Record<string, unknown>;

export interface ArtifactBase {
  artifact_id?: string;
  artifact_type: string;
  artifact_version?: number;
  artifact_status: string;
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
  artifact_type: "graph" | string;
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
  artifact_type: "document" | string;
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
  artifact_type: "crew_plan" | string;
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
  artifact_type: "time_cost" | string;
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
  generation_job_id: string;
  generation_status: string;
  started_at: string;
}

export interface RegeneratePayload {
  artifact_types?: string[] | null;
  reason?: string | null;
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

export interface OperationStatus {
  operation_id: string;
  operation_status?: string;
  project_id?: string;
  error_code?: string | null;
  error_message?: string | null;
  [key: string]: unknown;
}

export interface WorkbenchUploadSummary {
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
