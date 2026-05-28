import type { ProjectFile } from "../file/file.types.js";

export type ArtifactType = "document" | "schedule" | "time_cost" | "crew_plan";

export type ArtifactStatus = "processing" | "ready" | "failed" | "archived";

export interface ArtifactBase {
  id: string;
  project_id: string;
  type: ArtifactType;
  version: number;
  status: ArtifactStatus;
  title?: string | null;
  generated_at: string;
  source?: string;
}

export interface ProjectArtifactSummary extends ArtifactBase {
  summary?: Record<string, unknown>;
}

export interface ProjectArtifactListResponse {
  items: ProjectArtifactSummary[];
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
  type: "schedule";
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
  type: "document";
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
  type: "crew_plan";
  crew_types: CrewPlanGroup[];
  summary: {
    crew_type_count: number;
    crew_count: number;
    crew_task_count: number;
    planned_start_date: string;
    planned_finish_date: string;
  };
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

export interface TimeCostArtifact extends ArtifactBase {
  type: "time_cost";
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

export interface WorkbenchArtifactSummary {
  ready_artifact_count: number;
  latest_artifacts: ProjectArtifactSummary[];
}

export interface WorkbenchUploadSummaryResponse {
  project_info?: WorkbenchProjectInfo | null;
  files: ProjectFile[];
  artifact_summary: WorkbenchArtifactSummary;
}
