export type ApiListResponse<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

export interface SendSmsCodePayload {
  phone: string;
}

export interface SendSmsCodeResponse {
  phone: string;
  cooldown_seconds: number;
  sent_at: string;
}

export interface SmsLoginPayload {
  phone: string;
  sms_code: string;
  has_agreed_terms: boolean;
}

export interface PasswordLoginPayload {
  account: string;
  password: string;
  has_agreed_terms: boolean;
}

export interface SetupProfilePayload {
  username: string;
  password: string;
}

export interface UserProfile {
  user_id: string;
  username: string;
  account?: string;
  display_name?: string;
  role?: string;
  role_name?: string;
  avatar_text?: string;
  is_profile_completed?: boolean;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user: UserProfile;
}

export interface SetupProfileResponse {
  user_id: string;
  username: string;
  account: string;
  is_profile_completed: boolean;
}

export interface ProjectMetrics {
  total_count: number;
  in_progress_count: number;
  ready_artifact_count: number;
  average_generation_seconds: number;
  managed_count: number;
}

export interface ProjectListParams {
  status?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}

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

export interface CreateProjectPayload {
  project_name?: string;
  source_type?: string;
}

export interface CreateProjectResponse {
  project_id: string;
  project_name: string;
  status: string;
  created_at: string;
}

export type ProjectDetail = ProjectListItem & Record<string, unknown>;

export type ProjectFileCategory = "core" | "optional" | string;

export interface UploadInitPayload {
  original_file_name: string;
  file_size_bytes: number;
  file_category: ProjectFileCategory;
  file_role: string;
}

export interface UploadInitResponse {
  file_id: string;
  upload_url: string;
  storage_key: string;
  expire_at: string;
}

export interface CompleteUploadPayload {
  file_id: string;
  storage_key: string;
  upload_status: string;
}

export interface ProjectFileItem {
  file_id: string;
  file_category: string;
  file_role: string;
  original_file_name: string;
  file_extension?: string;
  file_size_bytes: number;
  page_count?: number;
  character_count?: number;
  upload_status: string;
  parse_status?: string;
  uploaded_at: string;
  parsed_at?: string | null;
  parse_error_message?: string | null;
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
}

export interface ExportAllResponse {
  export_job_id: string;
  export_status: string;
}

export interface RegenerateResponse {
  generation_job_id: string;
  generation_status: string;
  replaces_artifact_version_map: Record<string, unknown>;
}

export interface UploadSummary {
  primary_file: {
    file_id: string;
    original_file_name: string;
    page_count: number;
    character_count: number;
    uploaded_at: string;
    parse_status: string;
  } | null;
  project_info: {
    project_name?: string;
    project_subtitle?: string;
    location?: string;
    building_area_sqm?: number;
    contract_duration_days?: number;
    quality_standard?: string;
    contract_amount_cents?: number;
    control_amount_cents?: number;
    employer_name?: string;
    employer_contact_name?: string;
    qualification_requirement_text?: string;
    funding_source?: string;
    bid_evaluation_method?: string;
  };
  artifact_summary: {
    document_word_count?: number;
    schedule_task_count?: number;
    gantt_total_duration_days?: number;
    network_status?: string;
    crew_group_count?: number;
    time_cost_status?: string;
  };
}

export interface ArtifactBase {
  artifact_id: string;
  artifact_type: string;
  artifact_version: number;
  artifact_status: string;
  is_latest_version?: boolean;
  generated_at?: string;
}

export interface DocumentArtifact extends ArtifactBase {
  artifact_type: "document" | string;
  document_title: string;
  chapter_count: number;
  word_count: number;
  can_edit: boolean;
  toc_items: Array<Record<string, unknown>>;
  content_markdown: string;
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

export interface GanttArtifact extends ArtifactBase {
  artifact_type: "graph" | string;
  timeline_start_date: string;
  timeline_end_date: string;
  default_granularity: string;
  tasks: ScheduleTask[];
  gantt_items?: Array<Record<string, unknown>>;
}

export interface NetworkArtifact extends ArtifactBase {
  artifact_type: "graph" | string;
  critical_node_count: number;
  critical_path_summary: string;
  nodes: Array<{
    node_id: number;
    node_name: string;
    duration_days: number;
    crew_type_name?: string;
    crew_count?: number;
    es: number;
    ef: number;
    ls: number;
    lf: number;
    tf: number;
    is_critical_node: boolean;
    position_x: number;
    position_y: number;
  }>;
  edges: Array<Record<string, unknown>>;
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

export interface CrewPlanArtifact extends ArtifactBase {
  artifact_type: "crew_plan" | string;
  crew_types: Array<{
    crew_type_code: string;
    crew_type_name: string;
    color_hex: string;
    crew_count: number;
    crews: Array<Record<string, unknown>>;
  }>;
}

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

export interface ProjectScheme {
  scheme_id: string;
  scheme_name: string;
  scheme_type: string;
  is_active: boolean;
  current_process_version_id: string | null;
  process_version_count: number;
  total_duration_days: number | null;
  planned_start_date: string | null;
  planned_finish_date: string | null;
}

export interface ActivateSchemeResponse {
  active_scheme_id: string;
  activated_at: string;
}

export interface ProjectOperation {
  operation_id: string;
  status: "accepted" | "running" | "succeeded" | "failed" | string;
  action_type: string;
  scheme_id: string;
  generation_job_id: string | null;
  source_dataset_code: string | null;
  scenario_type: string | null;
  source_process_version_id: string | null;
  result_process_version_id: string | null;
  action_display_text: string;
  action_params: Record<string, unknown> | null;
  result_summary: string | null;
  error_code: string | null;
  error_message: string | null;
  confirmed_at: string | null;
  accepted_at: string | null;
  finished_at: string | null;
}
