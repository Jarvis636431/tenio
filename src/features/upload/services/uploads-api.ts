import { API_BASE } from "@/config";
import { buildUrl, request } from "@/services/http";
import type {
  FileUploadResponse,
  FileListResponse,
  FileListParams,
  FileDeletePayload,
  FileUpdatePayload,
  FileStatsResponse,
  ProjectFile,
  FileCategory,
} from "@/features/upload";

const BACKEND_BASE_URL = API_BASE.backend;
const API_V1 = `${BACKEND_BASE_URL}/api/v1`;

interface UploadFilePayload {
  projectId?: string | null;
  file: File;
  category: FileCategory;
  description?: string;
  tags?: string[];
}

/**
 * 获取文件列表
 */
export async function getFileList(params: FileListParams): Promise<FileListResponse> {
  const url = buildUrl(API_V1, `/projects/${params.projectId}/files`, {
    category: params.category ?? "",
    keyword: params.keyword ?? "",
    page: params.page ? String(params.page) : "",
    page_size: params.pageSize ? String(params.pageSize) : "",
  });
  return request<FileListResponse>(url);
}

/**
 * 上传文件（不依赖项目 ID，文件先暂存，上传完成后再创建项目）
 */
export async function uploadFile(
  payload: UploadFilePayload,
  onProgress?: (percent: number) => void,
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("category", payload.category);
  if (payload.description) {
    formData.append("description", payload.description);
  }
  payload.tags?.forEach((tag) => formData.append("tags", tag));

  onProgress?.(0);
  const url = payload.projectId
    ? `${API_V1}/projects/${payload.projectId}/files`
    : `${API_V1}/files`;
  const response = await request<FileUploadResponse>(url, {
    method: "POST",
    body: formData,
  });
  onProgress?.(100);
  return response;
}

/**
 * 删除文件
 */
export async function deleteFile(payload: FileDeletePayload): Promise<void> {
  await request<void>(`${API_V1}/projects/${payload.projectId}/files/${payload.fileId}`, {
    method: "DELETE",
  });
}

/**
 * 更新文件信息
 */
export async function updateFile(payload: FileUpdatePayload): Promise<ProjectFile> {
  const { fileId, ...data } = payload;
  return request<ProjectFile>(`${API_V1}/files/${fileId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

/**
 * 获取文件统计
 */
export async function getFileStats(projectId: string): Promise<FileStatsResponse> {
  return request<FileStatsResponse>(`${API_V1}/projects/${projectId}/files/stats`);
}

/**
 * 下载文件（获取下载链接）
 */
export async function getFileDownloadUrl(fileId: string): Promise<string> {
  const response = await request<{ url: string }>(`${API_V1}/files/${fileId}/download`);
  return response.url;
}
