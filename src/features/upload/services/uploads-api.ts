import { API_BASE } from "@/config";
import { request } from "@/services/http";
import type {
  FileUploadResponse,
  FileListResponse,
  FileListParams,
  FileDeletePayload,
  FileStatsResponse,
  ProjectFile,
  FileCategory,
} from "@/features/upload";

interface UploadFilePayload {
  projectId?: string | null;
  file: File;
  category: FileCategory;
  description?: string;
  tags?: string[];
}

type ApiListResponse<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

interface CreateProjectResponse {
  project_id: string;
  project_name: string;
  status: string;
  created_at: string;
}

interface UploadInitPayload {
  original_file_name: string;
  file_size_bytes: number;
  file_category: string;
  file_role: string;
}

interface UploadInitResponse {
  file_id: string;
  upload_url: string;
  storage_key: string;
  expire_at: string;
}

interface CompleteUploadPayload {
  file_id: string;
  storage_key: string;
  upload_status: string;
}

interface ProjectFileItem {
  file_id: string;
  file_category: string;
  file_role: string;
  original_file_name: string;
  file_extension?: string;
  file_size_bytes: number;
  page_count?: number;
  character_count?: number;
  upload_status: string;
  parse_status?: string;
  uploaded_at: string;
  parsed_at?: string | null;
  parse_error_message?: string | null;
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
async function createUploadProject(projectName: string): Promise<CreateProjectResponse> {
  return jsonRequest<CreateProjectResponse>("/projects", {
    project_name: projectName,
    source_type: "upload",
  });
}

/**
 * 获取项目文件上传凭证。
 */
function initProjectFileUpload(
  projectId: string,
  payload: UploadInitPayload,
): Promise<UploadInitResponse> {
  return jsonRequest<UploadInitResponse>(`/projects/${projectId}/files/upload-init`, payload);
}

/**
 * 通知后端文件上传已完成。
 */
function completeProjectFileUpload(
  projectId: string,
  payload: CompleteUploadPayload,
): Promise<void> {
  return jsonRequest<void>(`/projects/${projectId}/files/complete`, payload);
}

/**
 * 获取项目文件列表。
 */
function listProjectFiles(projectId: string): Promise<ApiListResponse<ProjectFileItem>> {
  return request<ApiListResponse<ProjectFileItem>>(`${APM_API_BASE}/projects/${projectId}/files`);
}

/**
 * 删除项目文件。
 */
async function deleteProjectFile(projectId: string, fileId: string): Promise<void> {
  await request<void>(`${APM_API_BASE}/projects/${projectId}/files/${fileId}`, {
    method: "DELETE",
  });
}

function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : "";
}

function toUploadRole(category: FileCategory) {
  if (category === "contract") return "primary_contract";
  if (category === "drawing") return "drawing";
  if (category === "document") return "bill_or_document";
  return "supplement";
}

function toFeatureFile(item: ProjectFileItem, projectId: string): ProjectFile {
  const category = (item.file_category || "other") as FileCategory;
  const fileName = item.original_file_name;
  const extension = item.file_extension ?? getFileExtension(fileName);

  return {
    id: item.file_id,
    projectId,
    name: fileName,
    originalName: fileName,
    size: item.file_size_bytes,
    type: extension ? `.${extension}` : "",
    category,
    url: "",
    uploadedAt: item.uploaded_at,
    status: item.upload_status === "completed" ? "completed" : "pending",
    parseStatus: item.parse_status,
    parsedAt: item.parsed_at,
    parseErrorMessage: item.parse_error_message,
  };
}

function toFileUploadResponse(item: ProjectFileItem, projectId: string): FileUploadResponse {
  const file = toFeatureFile(item, projectId);
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
  const files = response.items.map((item) => toFeatureFile(item, params.projectId));
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
    payload.projectId ??
    (await createUploadProject(payload.file.name.replace(/\.[^.]+$/, ""))).project_id;

  const init = await initProjectFileUpload(projectId, {
    original_file_name: payload.file.name,
    file_size_bytes: payload.file.size,
    file_category: payload.category,
    file_role: toUploadRole(payload.category),
  });
  onProgress?.(40);

  const uploadResponse = await fetch(init.upload_url, {
    method: "PUT",
    body: payload.file,
  });
  if (!uploadResponse.ok) {
    throw new Error(`文件上传失败 (${uploadResponse.status})`);
  }
  onProgress?.(80);

  await completeProjectFileUpload(projectId, {
    file_id: init.file_id,
    storage_key: init.storage_key,
    upload_status: "completed",
  });

  const files = await listProjectFiles(projectId);
  const uploadedFile = files.items.find((item) => item.file_id === init.file_id);
  onProgress?.(100);

  if (uploadedFile) {
    return toFileUploadResponse(uploadedFile, projectId);
  }

  return {
    fileId: init.file_id,
    projectId,
    name: payload.file.name,
    url: "",
    size: payload.file.size,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * 删除文件
 */
export async function deleteFile(payload: FileDeletePayload): Promise<void> {
  await deleteProjectFile(payload.projectId, payload.fileId);
}

/**
 * 获取文件统计
 */
export async function getFileStats(projectId: string): Promise<FileStatsResponse> {
  const response = await listProjectFiles(projectId);
  const categories = new Map<FileCategory, { count: number; totalSize: number }>();
  let totalSize = 0;

  response.items.forEach((item) => {
    const category = (item.file_category || "other") as FileCategory;
    totalSize += item.file_size_bytes;
    const previous = categories.get(category) ?? { count: 0, totalSize: 0 };
    categories.set(category, {
      count: previous.count + 1,
      totalSize: previous.totalSize + item.file_size_bytes,
    });
  });

  return {
    totalFiles: response.items.length,
    totalSize,
    categories: Array.from(categories.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      totalSize: stats.totalSize,
    })),
  };
}
