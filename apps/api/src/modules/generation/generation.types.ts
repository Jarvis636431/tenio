import type { GenerationJobStatus, GenerationStepStatus } from "@prisma/client";

export interface StartGenerationResponse {
  id: string;
  project_id: string;
  status: string;
  progress_percent: number;
  started_at: string | null;
}

export interface GenerationStepResponse {
  code: string;
  name: string;
  order: number;
  status: string;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface GenerationStatusResponse {
  id: string;
  project_id: string;
  status: string;
  progress_percent: number;
  current_step?: GenerationStepResponse | null;
  started_at: string | null;
  finished_at?: string | null;
  steps: GenerationStepResponse[];
  error?: {
    code: string;
    message: string;
  } | null;
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
