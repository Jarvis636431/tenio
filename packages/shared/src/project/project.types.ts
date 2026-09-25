import type { PaginatedResponse } from "../common/pagination.js";

export type ProjectStatus = "draft" | "uploading" | "generating" | "active" | "failed" | "archived";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  ready_artifact_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
}

export type CreateProjectResponse = Project;

export type ListProjectsResponse = PaginatedResponse<Project>;

export interface ProjectMetrics {
  total_count: number;
  in_progress_count: number;
  ready_artifact_count: number;
  average_generation_seconds: number;
  managed_count: number;
}
