import type { PaginatedResponse } from "../common/pagination.js";

export type ProjectFileCategory =
  | "model"
  | "drawing"
  | "schedule"
  | "cost"
  | "contract"
  | "other";

export type ProjectFileStatus =
  | "pending"
  | "uploading"
  | "uploaded"
  | "processing"
  | "ready"
  | "failed";

export interface ProjectFile {
  file_id: string;
  project_id: string;
  original_file_name: string;
  stored_file_name: string;
  mime_type?: string;
  file_size: number;
  storage_bucket: string;
  storage_key: string;
  category: ProjectFileCategory;
  status: ProjectFileStatus;
  created_at: string;
  updated_at: string;
}

export interface UploadInitRequest {
  original_file_name: string;
  file_size: number;
  mime_type?: string;
  category: ProjectFileCategory;
}

export interface UploadInitResponse {
  file_id: string;
  project_id: string;
  storage_bucket: string;
  storage_key: string;
  upload_url: string;
  expires_at: string;
  headers: Record<string, string>;
}

export interface UploadCompleteRequest {
  file_id: string;
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
  file_id: string;
  deleted_at: string;
}

export interface ProjectFileDownloadUrlResponse {
  file_id: string;
  download_url: string;
  expires_at: string;
}
