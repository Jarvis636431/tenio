import { API_BASE } from "@/config";
import {
  addMockFile,
  deleteMockFile,
  getMockFileList,
  getMockFileStats,
  updateMockFile,
} from "@/mocks/apmMockStore";
import type {
  FileUploadResponse,
  FileListResponse,
  FileListParams,
  FileDeletePayload,
  FileUpdatePayload,
  FileStatsResponse,
  ProjectFile,
  FileCategory,
} from "@/features/project";

const BACKEND_BASE_URL = API_BASE.backend;
const API_V1 = `${BACKEND_BASE_URL}/api/v1`;

// ============================================================================
// API 函数
// ============================================================================

/**
 * 获取文件列表
 */
export async function getFileList(params: FileListParams): Promise<FileListResponse> {
  await delay(500);
  return getMockFileList(params);
}

/**
 * 上传文件
 */
export async function uploadFile(
  projectId: string,
  payload: { file: File; category: FileCategory; description?: string; tags?: string[] },
  onProgress?: (percent: number) => void,
): Promise<FileUploadResponse> {
  for (let i = 1; i <= 10; i++) {
    await delay(200);
    onProgress?.(i * 10);
  }

  const nextFile = addMockFile(projectId, payload);
  return {
    fileId: nextFile.id,
    name: nextFile.name,
    url: nextFile.url,
    thumbnailUrl: nextFile.thumbnailUrl,
    size: nextFile.size,
    uploadedAt: nextFile.uploadedAt,
  };
}

/**
 * 删除文件
 */
export async function deleteFile(payload: FileDeletePayload): Promise<void> {
  await delay(300);
  deleteMockFile(payload.projectId, payload.fileId);
}

/**
 * 更新文件信息
 */
export async function updateFile(payload: FileUpdatePayload): Promise<ProjectFile> {
  await delay(300);
  return updateMockFile(payload);
}

/**
 * 获取文件统计
 */
export async function getFileStats(projectId: string): Promise<FileStatsResponse> {
  await delay(300);
  return getMockFileStats(projectId);
}

/**
 * 下载文件（获取下载链接）
 */
export async function getFileDownloadUrl(fileId: string): Promise<string> {
  await delay(100);
  return `${API_V1}/files/${fileId}/download`;
}

// ============================================================================
// 辅助函数
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
