/**
 * 项目资料上传管理类型定义
 */

export type FileCategory = "core" | "drawing" | "document" | "contract" | "photo" | "bim" | "other";

export type FileStatus = "pending" | "uploading" | "completed" | "error";

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  category: FileCategory;
  role?: string;
  extension?: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  uploadedBy?: string;
  uploadedAt: string;
  status: FileStatus;
  parseStatus?: string;
  parsedAt?: string | null;
  parseErrorMessage?: string | null;
  pageCount?: number;
  characterCount?: number;
  mockDatasetCode?: string | null;
  version?: number;
  parentId?: string;
  tags?: string[];
}

export interface FileUploadPayload {
  file: File;
  category: FileCategory;
  description?: string;
  tags?: string[];
}

export interface FileUploadResponse {
  fileId: string;
  projectId?: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  uploadedAt: string;
}

export interface FileListParams {
  projectId: string;
  category?: FileCategory;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface FileListResponse {
  list: ProjectFile[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FileCategoryStat {
  category: FileCategory;
  count: number;
  totalSize: number;
}

export interface FileStatsResponse {
  totalFiles: number;
  pendingFiles: number;
  uploadedFiles: number;
  readyFiles: number;
  failedFiles: number;
}

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  core: "核心资料",
  drawing: "图纸",
  document: "文档",
  contract: "合同",
  photo: "照片",
  bim: "BIM模型",
  other: "其他",
};

export const FILE_CATEGORY_ICONS: Record<FileCategory, string> = {
  core: "📦",
  drawing: "📐",
  document: "📄",
  contract: "📝",
  photo: "📷",
  bim: "🏗️",
  other: "📎",
};
