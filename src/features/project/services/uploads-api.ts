import { API_BASE } from "@/config";
// import { request } from "@/services/http";
import type {
  FileUploadResponse,
  FileListResponse,
  FileListParams,
  FileDeletePayload,
  FileUpdatePayload,
  FileStatsResponse,
  ProjectFile,
  FileCategory,
} from "../types/uploads";

const BACKEND_BASE_URL = API_BASE.backend;
const API_V1 = `${BACKEND_BASE_URL}/api/v1`;

// ============================================================================
// Mock 数据（用于开发阶段）
// ============================================================================

const MOCK_FILES: ProjectFile[] = [
  {
    id: "file-001",
    projectId: "project-001",
    name: "建筑平面图_v1.pdf",
    originalName: "建筑平面图.pdf",
    size: 2_500_000,
    type: "application/pdf",
    category: "drawing",
    url: "/mock/drawing1.pdf",
    thumbnailUrl: "/mock/drawing1-thumb.jpg",
    description: "主楼建筑平面图",
    uploadedBy: "张三",
    uploadedAt: "2024-03-15T10:30:00Z",
    status: "completed",
    version: 1,
    tags: ["建筑", "平面图"],
  },
  {
    id: "file-002",
    projectId: "project-001",
    name: "结构设计说明.docx",
    originalName: "结构设计说明.docx",
    size: 1_200_000,
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    category: "document",
    url: "/mock/doc1.docx",
    description: "结构设计说明文档",
    uploadedBy: "李四",
    uploadedAt: "2024-03-14T14:20:00Z",
    status: "completed",
    tags: ["结构", "设计"],
  },
  {
    id: "file-003",
    projectId: "project-001",
    name: "施工现场照片_001.jpg",
    originalName: "IMG_20240310_143052.jpg",
    size: 3_800_000,
    type: "image/jpeg",
    category: "photo",
    url: "/mock/photo1.jpg",
    thumbnailUrl: "/mock/photo1-thumb.jpg",
    description: "基础施工进度照片",
    uploadedBy: "王五",
    uploadedAt: "2024-03-10T14:30:52Z",
    status: "completed",
    tags: ["施工", "进度"],
  },
  {
    id: "file-004",
    projectId: "project-001",
    name: "施工合同.pdf",
    originalName: "施工合同.pdf",
    size: 5_600_000,
    type: "application/pdf",
    category: "contract",
    url: "/mock/contract1.pdf",
    description: "主体施工合同",
    uploadedBy: "张三",
    uploadedAt: "2024-03-01T09:00:00Z",
    status: "completed",
    tags: ["合同", "重要"],
  },
  {
    id: "file-005",
    projectId: "project-001",
    name: "BIM模型_v2.ifc",
    originalName: "building_model.ifc",
    size: 25_000_000,
    type: "application/x-step",
    category: "bim",
    url: "/mock/model.ifc",
    description: "建筑BIM模型",
    uploadedBy: "李四",
    uploadedAt: "2024-03-16T11:15:00Z",
    status: "completed",
    version: 2,
    parentId: "file-005-v1",
    tags: ["BIM", "模型"],
  },
];

// ============================================================================
// API 函数
// ============================================================================

/**
 * 获取文件列表
 */
export async function getFileList(params: FileListParams): Promise<FileListResponse> {
  // Mock 实现
  await delay(500);

  let list = MOCK_FILES.filter((f) => f.projectId === params.projectId);

  if (params.category) {
    list = list.filter((f) => f.category === params.category);
  }

  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    list = list.filter(
      (f) =>
        f.name.toLowerCase().includes(keyword) ||
        f.description?.toLowerCase().includes(keyword) ||
        f.tags?.some((t) => t.toLowerCase().includes(keyword)),
    );
  }

  const total = list.length;
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    list: list.slice(start, end),
    total,
    page,
    pageSize,
  };
}

/**
 * 上传文件
 */
export async function uploadFile(
  projectId: string,
  payload: { file: File; category: FileCategory; description?: string; tags?: string[] },
  onProgress?: (percent: number) => void,
): Promise<FileUploadResponse> {
  // Mock 实现 - 模拟上传进度
  void projectId; // 预留，用于实际实现时关联项目
  const totalSize = payload.file.size;
  void totalSize; // 预留，用于实际实现时计算分块

  for (let i = 1; i <= 10; i++) {
    await delay(200);
    onProgress?.(i * 10);
  }

  const fileId = `file-${Date.now()}`;
  return {
    fileId,
    name: payload.file.name,
    url: `/mock/${fileId}`,
    size: payload.file.size,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * 删除文件
 */
export async function deleteFile(payload: FileDeletePayload): Promise<void> {
  await delay(300);
  // Mock 删除成功
  console.log("[Mock] Deleted file:", payload.fileId);
}

/**
 * 更新文件信息
 */
export async function updateFile(payload: FileUpdatePayload): Promise<ProjectFile> {
  await delay(300);
  const file = MOCK_FILES.find((f) => f.id === payload.fileId);
  if (!file) {
    throw new Error("文件不存在");
  }
  return {
    ...file,
    name: payload.name ?? file.name,
    description: payload.description ?? file.description,
    category: payload.category ?? file.category,
    tags: payload.tags ?? file.tags,
  };
}

/**
 * 获取文件统计
 */
export async function getFileStats(projectId: string): Promise<FileStatsResponse> {
  await delay(300);

  const files = MOCK_FILES.filter((f) => f.projectId === projectId);
  const categories = groupByCategory(files);

  return {
    totalFiles: files.length,
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
    categories,
  };
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

function groupByCategory(files: ProjectFile[]) {
  const stats: Record<string, { count: number; totalSize: number }> = {};

  for (const file of files) {
    const cat = file.category;
    if (!stats[cat]) {
      stats[cat] = { count: 0, totalSize: 0 };
    }
    stats[cat].count++;
    stats[cat].totalSize += file.size;
  }

  return Object.entries(stats).map(([category, data]) => ({
    category: category as FileCategory,
    ...data,
  }));
}
