import type { GenerationJobStatus, GenerationStepStatus } from "@prisma/client";

export interface StartGenerationResponse {
  generation_job_id: string;
  generation_status: string;
  started_at: string;
}

export interface GenerationStepResponse {
  step_code: string;
  step_name: string;
  step_order: number;
  step_status: string;
  step_started_at?: string | null;
  step_finished_at?: string | null;
}

export interface GenerationStatusResponse {
  generation_job_id: string;
  project_id: string;
  generation_status: string;
  current_step_code: string;
  current_step_name: string;
  step_progress_percent: number;
  started_at: string;
  finished_at?: string | null;
  steps: GenerationStepResponse[];
  error_code?: string | null;
  error_message?: string | null;
}

export interface GenerationStepDefinition {
  stepCode: string;
  stepName: string;
  stepOrder: number;
}

export function toGenerationJobStatusValue(status: GenerationJobStatus): string {
  return status.toLowerCase();
}

export function toGenerationStepStatusValue(status: GenerationStepStatus): string {
  return status.toLowerCase();
}
