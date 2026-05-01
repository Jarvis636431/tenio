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
  artifact_id: string;
  artifact_type: string;
  artifact_version: number;
  artifact_status: string;
  is_latest_version?: boolean;
  generated_at?: string;
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
  scheme_id?: string;
  process_version_id?: string;
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
  title: string;
  level?: number;
  anchor?: string;
  children?: DocumentTocItem[];
}

export interface DocumentArtifact extends ArtifactBase {
  artifact_type: "document" | string;
  title?: string;
  content?: string;
  markdown?: string;
  markdown_content?: string;
  document_content?: string;
  word_count?: number;
  chapter_count?: number;
  toc?: DocumentTocItem[];
  sections?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export type CrewPlanArtifact = ArtifactBase & Record<string, unknown>;

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
