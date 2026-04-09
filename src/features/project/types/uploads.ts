/**
 * 项目资料上传管理类型定义
 */

export type FileCategory = "drawing" | "document" | "contract" | "photo" | "bim" | "other";

export type FileStatus = "pending" | "uploading" | "completed" | "error";

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  category: FileCategory;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  uploadedBy?: string;
  uploadedAt: string;
  status: FileStatus;
  version?: number;
  parentId?: string; // 用于版本管理
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

export interface FileDeletePayload {
  projectId: string;
  fileId: string;
}

export interface FileUpdatePayload {
  fileId: string;
  name?: string;
  description?: string;
  category?: FileCategory;
  tags?: string[];
}

export interface FileCategoryStat {
  category: FileCategory;
  count: number;
  totalSize: number;
}

export interface FileStatsResponse {
  totalFiles: number;
  totalSize: number;
  categories: FileCategoryStat[];
}

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  drawing: "图纸",
  document: "文档",
  contract: "合同",
  photo: "照片",
  bim: "BIM模型",
  other: "其他",
};

export const FILE_CATEGORY_ICONS: Record<FileCategory, string> = {
  drawing: "📐",
  document: "📄",
  contract: "📝",
  photo: "📷",
  bim: "🏗️",
  other: "📎",
};
