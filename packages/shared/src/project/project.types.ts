import type { PaginatedResponse } from "../common/pagination.js";

export type ProjectStatus = "draft" | "active" | "archived";

export interface Project {
  project_id: string;
  project_name: string;
  project_status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  project_name: string;
}

export type CreateProjectResponse = Project;

export type ListProjectsResponse = PaginatedResponse<Project>;
