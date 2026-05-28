import { API_BASE } from "@/config";
import { request } from "@/services/http";
import type {
  FileUploadResponse,
  FileListResponse,
  FileListParams,
  FileStatsResponse,
  ProjectFile,
  FileCategory,
} from "../types/uploads";

interface UploadFilePayload {
  projectId?: string | null;
  file: File;
  category: FileCategory;
  description?: string;
  tags?: string[];
}

type BackendFileCategory =
  | "model"
  | "drawing"
  | "schedule"
  | "bill"
  | "contract"
  | "site_photo"
  | "other";
type BackendFileStatus = "pending" | "uploading" | "uploaded" | "processing" | "ready" | "failed";

interface BackendCreateProjectResponse {
  id: string;
  name: string;
  status: "draft" | "uploading" | "generating" | "active" | "failed" | "archived";
  created_at: string;
  updated_at: string;
}

interface BackendProjectFile {
  id: string;
  project_id: string;
  original_name: string;
  mime_type?: string;
  size_bytes: number;
  category: BackendFileCategory;
  status: BackendFileStatus;
  created_at: string;
  updated_at: string;
}

interface BackendListProjectFilesResponse {
  items: BackendProjectFile[];
  total: number;
  page: number;
  page_size: number;
}

interface BackendProjectFileStatsResponse {
  total_files: number;
  pending_files: number;
  uploaded_files: number;
  ready_files: number;
  failed_files: number;
}

interface BackendUploadInitRequest {
  original_name: string;
  size_bytes: number;
  mime_type?: string;
  category: BackendFileCategory;
}

interface BackendUploadInitResponse {
  file: BackendProjectFile;
  upload: {
    url: string;
    method: "PUT";
    expires_at: string;
    headers: Record<string, string>;
  };
}

interface BackendUploadCompleteRequest {
  id: string;
}

interface BackendUploadCompleteResponse {
  file: BackendProjectFile;
}

const APM_API_BASE = `${API_BASE.backend}/api`;

function jsonRequest<T>(path: string, payload?: unknown) {
  return request<T>(`${APM_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload == null ? undefined : JSON.stringify(payload),
  });
}

/**
 * 创建上传入口使用的项目。
 */
export async function createUploadProject(
  projectName: string,
): Promise<BackendCreateProjectResponse> {
  return jsonRequest<BackendCreateProjectResponse>("/projects", {
    name: projectName,
  });
}

/**
 * 获取项目文件上传凭证。
 */
function initProjectFileUpload(
  projectId: string,
  payload: BackendUploadInitRequest,
): Promise<BackendUploadInitResponse> {
  return jsonRequest<BackendUploadInitResponse>(`/projects/${projectId}/uploads/init`, payload);
}

/**
 * 通知后端文件上传已完成。
 */
function completeProjectFileUpload(
  projectId: string,
  payload: BackendUploadCompleteRequest,
): Promise<BackendUploadCompleteResponse> {
  return jsonRequest<BackendUploadCompleteResponse>(
    `/projects/${projectId}/uploads/complete`,
    payload,
  );
}

/**
 * 获取项目文件列表。
 */
function listProjectFiles(projectId: string): Promise<BackendListProjectFilesResponse> {
  return request<BackendListProjectFilesResponse>(`${APM_API_BASE}/projects/${projectId}/files`);
}

/**
 * 获取项目文件统计。
 */
function getProjectFileStats(projectId: string): Promise<BackendProjectFileStatsResponse> {
  return request<BackendProjectFileStatsResponse>(
    `${APM_API_BASE}/projects/${projectId}/files/stats`,
  );
}

function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : "";
}

function toBackendFileCategory(category: FileCategory) {
  switch (category) {
    case "contract":
      return "contract";
    case "drawing":
      return "drawing";
    case "document":
      return "bill";
    case "bim":
      return "model";
    case "photo":
    case "other":
      return "other";
  }
}

function toFrontendFileCategory(category: BackendFileCategory): FileCategory {
  switch (category) {
    case "contract":
      return "contract";
    case "drawing":
      return "drawing";
    case "bill":
      return "document";
    case "site_photo":
      return "photo";
    case "model":
      return "bim";
    case "schedule":
    case "other":
      return "other";
  }
}

function toFrontendFileStatus(status: BackendFileStatus): ProjectFile["status"] {
  switch (status) {
    case "ready":
    case "uploaded":
      return "completed";
    case "failed":
      return "error";
    case "uploading":
    case "processing":
      return "uploading";
    case "pending":
      return "pending";
  }
}

function toFeatureFile(item: BackendProjectFile): ProjectFile {
  const category = toFrontendFileCategory(item.category);
  const fileName = item.original_name;
  const extension = getFileExtension(fileName);

  return {
    id: item.id,
    projectId: item.project_id,
    name: fileName,
    originalName: fileName,
    size: item.size_bytes,
    type: extension ? `.${extension}` : "",
    category,
    extension,
    url: "",
    uploadedAt: item.created_at,
    status: toFrontendFileStatus(item.status),
  };
}

function toFileUploadResponse(item: BackendProjectFile): FileUploadResponse {
  const file = toFeatureFile(item);
  return {
    fileId: file.id,
    projectId: file.projectId,
    name: file.name,
    url: file.url,
    size: file.size,
    uploadedAt: file.uploadedAt,
  };
}

function filterFiles(files: ProjectFile[], params: FileListParams) {
  const keyword = params.keyword?.trim().toLowerCase();
  return files.filter((file) => {
    const matchesCategory = !params.category || file.category === params.category;
    const matchesKeyword = !keyword || file.name.toLowerCase().includes(keyword);
    return matchesCategory && matchesKeyword;
  });
}

/**
 * 获取文件列表
 */
export async function getFileList(params: FileListParams): Promise<FileListResponse> {
  const response = await listProjectFiles(params.projectId);
  const files = response.items.map((item) => toFeatureFile(item));
  const filteredFiles = filterFiles(files, params);
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? filteredFiles.length;
  const start = (page - 1) * pageSize;
  return {
    list: filteredFiles.slice(start, start + pageSize),
    total: filteredFiles.length,
    page,
    pageSize,
  };
}

/**
 * 上传文件；无项目 ID 时先创建临时项目，再走新后端上传凭证流程。
 */
export async function uploadFile(
  payload: UploadFilePayload,
  onProgress?: (percent: number) => void,
): Promise<FileUploadResponse> {
  onProgress?.(0);

  const projectId =
    payload.projectId ?? (await createUploadProject(payload.file.name.replace(/\.[^.]+$/, ""))).id;

  const init = await initProjectFileUpload(projectId, {
    original_name: payload.file.name,
    size_bytes: payload.file.size,
    mime_type: payload.file.type || undefined,
    category: toBackendFileCategory(payload.category),
  });
  onProgress?.(40);

  const uploadResponse = await fetch(init.upload.url, {
    method: init.upload.method,
    headers: init.upload.headers,
    body: payload.file,
  });
  if (!uploadResponse.ok) {
    throw new Error(`文件上传失败 (${uploadResponse.status})`);
  }
  onProgress?.(80);

  const completed = await completeProjectFileUpload(projectId, {
    id: init.file.id,
  });
  onProgress?.(100);

  return toFileUploadResponse(completed.file);
}

/**
 * 获取文件统计
 */
export async function getFileStats(projectId: string): Promise<FileStatsResponse> {
  const response = await getProjectFileStats(projectId);

  return {
    totalFiles: response.total_files,
    pendingFiles: response.pending_files,
    uploadedFiles: response.uploaded_files,
    readyFiles: response.ready_files,
    failedFiles: response.failed_files,
  };
}
