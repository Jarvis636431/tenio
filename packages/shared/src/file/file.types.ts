import type { PaginatedResponse } from "../common/pagination.js";

export type ProjectFileCategory =
  | "model"
  | "drawing"
  | "schedule"
  | "bill"
  | "contract"
  | "site_photo"
  | "other";

export type ProjectFileStatus =
  | "pending"
  | "uploading"
  | "uploaded"
  | "processing"
  | "ready"
  | "failed";

export interface ProjectFile {
  id: string;
  project_id: string;
  original_name: string;
  mime_type?: string | null;
  size_bytes: number;
  category: ProjectFileCategory;
  status: ProjectFileStatus;
  created_at: string;
  updated_at: string;
}

export interface UploadInitRequest {
  original_name: string;
  size_bytes: number;
  mime_type?: string | null;
  category: ProjectFileCategory;
}

export interface UploadInitResponse {
  file: ProjectFile;
  upload: {
    url: string;
    method: "PUT";
    headers: Record<string, string>;
    expires_at: string;
  };
}

export interface UploadCompleteRequest {
  id: string;
}

export interface UploadCompleteResponse {
  file: ProjectFile;
}

export interface ListProjectFilesResponse extends PaginatedResponse<ProjectFile> {}

export interface GetProjectFileResponse {
  file: ProjectFile;
}

export interface ProjectFileStatsResponse {
  total_files: number;
  pending_files: number;
  uploaded_files: number;
  ready_files: number;
  failed_files: number;
}

export interface DeleteProjectFileResponse {
  id: string;
}

export interface ProjectFileDownloadUrlResponse {
  id: string;
  url: string;
  expires_at: string;
}
