import type { PaginatedResponse } from "../common/pagination.js";

export type ProjectStatus = "draft" | "uploading" | "generating" | "active" | "failed" | "archived";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
}

export type CreateProjectResponse = Project;

export type ListProjectsResponse = PaginatedResponse<Project>;
