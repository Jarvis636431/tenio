export interface CoreGraphWorkProcess {
  id: string;
  project_id: string;
  seq_no?: number;
  code?: string;
  name?: string;
  is_dummy?: boolean;
  express_ids?: string[];
  tag?: string[];
  calc?: boolean;
  quantity?: number;
  unit?: string;
  base_duration_days?: number;
  duration_days?: number;
  team_size?: number;
  suggested_team_count?: number;
  construction_coefficient?: number;
  labor_cost?: number;
  material_cost?: number;
  device_rental_cost?: number;
  building_number?: string | null;
  outline_level?: number;
  outline_path?: string;
  outline_metadata?: Record<string, unknown>;
  trade?: { id: number; name: string; code: string };
  process_type?: { id: number; name: string; code: string };
  selected_method?: { id: number; name: string; code: string };
  selected_condition?: { id: number; name: string; code: string };
  execution_state?: {
    id: string;
    work_process_id: string;
    status: string;
    planned_intervals?: Array<{
      id: string;
      execution_state_id: string;
      start_datetime: string;
      end_datetime: string;
      interval_type?: string;
      seq_no?: number;
    }>;
    planned_start_datetime?: string;
    planned_end_datetime?: string;
    actual_start_datetime?: string | null;
    actual_end_datetime?: string | null;
    progress_percent?: number;
    critical_path?: boolean;
  };
}

export interface CoreGraphDependency {
  id: string;
  project_id: string;
  from_work_process_id?: string;
  to_work_process_id?: string;
  predecessor_id?: string;
  successor_id?: string;
  dependency_type?: string;
  lag_days?: number;
  is_deleted?: boolean;
  edge_type?: string;
  description?: string | null;
}

export interface CoreGraphResponse {
  project_id: string;
  work_processes: CoreGraphWorkProcess[];
  dependencies: CoreGraphDependency[];
  team_assignments: Array<Record<string, unknown>>;
  resource_estimations: Array<Record<string, unknown>>;
  device_resources: Array<Record<string, unknown>>;
  work_process_device_resources: Array<Record<string, unknown>>;
  execution_states?: Array<Record<string, unknown>>;
  method_factors?: Array<Record<string, unknown>>;
  condition_factors?: Array<Record<string, unknown>>;
  version?: number;
  updated_at?: string;
}

export interface CostCurvePoint {
  date: string;
  material_cost?: number;
  floating_cost?: number;
  total_cost: number;
}

export interface CostCurveResponse {
  id?: string;
  project_id: string;
  start_date?: string;
  days: number[];
  dates: string[];
  total_costs: number[];
  material_costs?: number[];
  floating_costs?: number[];
  created_at?: string;
  generated_at?: string;
}

export interface HeadcountCurvePoint {
  date: string;
  headcount: number;
}

export interface HeadcountCurveResponse {
  id?: string;
  project_id: string;
  start_date?: string;
  days: number[];
  dates: string[];
  headcounts: number[];
  created_at?: string;
  generated_at?: string;
}

export interface CreateWorkProcessPayload {
  name: string;
  duration_days: number;
  trade_id?: number;
  predecessor_ids?: string[];
  successor_ids?: string[];
}

export interface CreateWorkProcessResponse {
  work_process_id: string;
  project_id: string;
  name: string;
  duration_days: number;
  trade_id?: number | null;
  message: string;
}

export interface TaskStatusResponse {
  task_id: string;
  algorithm_type: string;
  status: "pending" | "running" | "completed" | "failed" | string;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  progress?: number | null;
  error?: string | null;
  current_result_id?: string | null;
}

export interface TeamAssignmentItem {
  team_id: string;
  team_name: string;
  work_process_id: string;
  work_process_code: string;
  work_process_name: string;
  building_number?: string | null;
  planned_start_datetime?: string | null;
  planned_end_datetime?: string | null;
  assigned_workers_count: number;
}

export interface TeamAssignmentsResponse {
  project_id: string;
  total_assignments: number;
  assignments: TeamAssignmentItem[];
}

export interface CompressionStartPayload {
  target_duration_hours: number;
  batch_size?: number;
  compression_factor?: number;
  final_solve_time_limit_seconds?: number;
  estimate_time_limit_seconds?: number;
  solver_relative_gap?: number;
}

export interface CompressionStartResponse {
  run_id: string;
  project_id: string;
  status: "pending";
  message: string;
  target_duration_hours: number;
  progress_percent: number;
}

export interface CompressionIteration {
  iteration: number;
  stage: string;
  estimated_duration_hours: number;
  compressed_batch: number;
  compressed_quantity_based: number;
  total_compressed: number;
  compression_factor: number;
  batch_size: number;
  message: string;
  timestamp: string;
}

export interface CompressionResultSummary {
  initial_total_duration_hours: number;
  final_total_duration_hours: number;
  target_duration_hours: number;
  iterations: number;
  task_count: number;
}

export interface CompressionStatusResponse {
  run_id: string;
  project_id: string;
  status: "running" | "completed" | "failed";
  progress_percent: number;
  target_duration_hours: number;
  latest_estimated_duration_hours?: number;
  iterations: CompressionIteration[];
  result_summary?: CompressionResultSummary;
  message?: string;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}
