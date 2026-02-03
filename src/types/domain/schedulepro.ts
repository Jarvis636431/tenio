export interface AuthRegisterPayload {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthLoginPayload {
  username: string;
  password: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
}

export interface AuthMeResponse {
  user_id: string;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
}

export interface CreateJiuanProjectPayload {
  project_name: string;
}

export interface CreateJiuanProjectResponse {
  project_id: string;
  project_name: string;
  status: "created";
  work_process_count: number;
  dependency_count: number;
}

export interface SelectSolutionPayload {
  solution_id: number;
}

export interface HolidayInfo {
  date: string;
  name: string;
}

export interface SelectSolutionResponse {
  project_id: string;
  solution_id: number;
  total_duration_hours: number;
  start_date: string;
  finish_date: string;
  matched_tasks: number;
  skipped_tasks: number;
  holidays: HolidayInfo[];
  daily_schedule: Record<string, string[]>;
}

export interface CoreGraphResponse {
  project_id: string;
  work_processes: Array<Record<string, unknown>>;
  dependencies: Array<Record<string, unknown>>;
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
  day_index: number;
  labor_cost: number;
  rental_cost: number;
  total_cost: number;
}

export interface CostCurveResponse {
  project_id: string;
  start_date: string;
  points: CostCurvePoint[];
  total_labor_cost: number;
  total_rental_cost: number;
  total_cost: number;
  generated_at: string;
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
