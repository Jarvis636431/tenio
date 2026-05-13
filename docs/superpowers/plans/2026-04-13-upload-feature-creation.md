# Upload Feature Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Upload 相关功能从 project feature 和 `src/pages/` 抽取为独立的 `src/features/upload/` feature，保持现有路由不变，消除 `src/pages/Upload.tsx`。

**Architecture:**
- 新建 `src/features/upload/` 作为独立 feature，拥有 types、services、hooks、pages
- `src/features/project/index.ts` 从 `@/features/upload` re-export 兼容原有消费者
- 路由 `/upload` 的 import 路径从 `@/pages/Upload` 改为 `@/features/upload`
- 所有原来从 `@/features/project` 导入 Upload 相关类型的消费者改为从 `@/features/upload` 导入

**Tech Stack:** React 18 + TypeScript + React Query + React Router v6

---

## File Map

### 新建
- `src/features/upload/types/uploads.ts` — 从 project 移入
- `src/features/upload/services/uploads-api.ts` — 从 project 移入
- `src/features/upload/hooks/useUploads.ts` — 从 project 移入
- `src/features/upload/pages/UploadPage.tsx` — 从 `src/pages/Upload.tsx` 移入
- `src/features/upload/index.ts` — 新 barrel export
- `src/features/upload/queryKeys.ts` — 新建，uploads query keys

### 修改
- `src/features/project/types/uploads.ts` — 删除（迁移至 upload feature）
- `src/features/project/services/uploads-api.ts` — 删除（迁移至 upload feature）
- `src/features/project/hooks/useUploads.ts` — 删除（迁移至 upload feature）
- `src/features/project/components/UploadsTab.tsx` — import 路径从 `@/features/project` 改为 `@/features/upload`
- `src/features/project/index.ts` — re-export from `@/features/upload`
- `src/routes/AppRoutes.tsx:11` — UploadPage import 路径改为 `@/features/upload`
- `src/pages/Upload.tsx` — 删除

---

## Task 1: 创建 upload feature 目录结构和类型

**Files:**
- Create: `src/features/upload/types/uploads.ts`
- Modify: `src/features/project/types/uploads.ts` — 清空内容，重导出 from upload

- [ ] **Step 1: 创建目录和类型文件**

```bash
mkdir -p src/features/upload/{types,services,hooks,pages}
```

创建 `src/features/upload/types/uploads.ts`（内容从 project 的 uploads.ts 原样移入）：

```typescript
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
```

- [ ] **Step 2: 修改 project 的 uploads.ts 为重导出**

将 `src/features/project/types/uploads.ts` 改为：

```typescript
/**
 * @internal
 * 已迁移至 @/features/upload/types/uploads.ts
 */
export { FileCategory, FileStatus, ProjectFile, FileUploadPayload, FileUploadResponse, FileListParams, FileListResponse, FileDeletePayload, FileUpdatePayload, FileCategoryStat, FileStatsResponse, FILE_CATEGORY_LABELS, FILE_CATEGORY_ICONS } from "@/features/upload/types/uploads";
```

- [ ] **Step 3: 提交**

```bash
git add src/features/upload/types/uploads.ts src/features/project/types/uploads.ts
git commit -m "feat: create upload feature types and re-export from project"
```

---

## Task 2: 迁移 uploads-api 服务

**Files:**
- Create: `src/features/upload/services/uploads-api.ts`
- Modify: `src/features/project/services/uploads-api.ts` — 清空，重导出
- Modify: `src/features/upload/types/uploads.ts` — import 路径更新

- [ ] **Step 1: 创建 uploads-api.ts（从 project 原样移入，注意 import 路径变化）**

创建 `src/features/upload/services/uploads-api.ts`：

```typescript
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
} from "@/features/upload/types/uploads";

const BACKEND_BASE_URL = API_BASE.backend;
const API_V1 = `${BACKEND_BASE_URL}/api/v1`;

/**
 * 获取文件列表
 */
export async function getFileList(params: FileListParams): Promise<FileListResponse> {
  await delay(500);
  return getMockFileList(params);
}

/**
 * 上传文件（不依赖项目 ID，文件先暂存，上传完成后再创建项目）
 */
export async function uploadFile(
  payload: { file: File; category: FileCategory; description?: string; tags?: string[] },
  onProgress?: (percent: number) => void,
): Promise<FileUploadResponse> {
  for (let i = 1; i <= 10; i++) {
    await delay(200);
    onProgress?.(i * 10);
  }

  const nextFile = addMockFile("temp", payload);
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

- [ ] **Step 2: 修改 project 的 uploads-api.ts 为重导出**

将 `src/features/project/services/uploads-api.ts` 改为：

```typescript
/**
 * @internal
 * 已迁移至 @/features/upload/services/uploads-api.ts
 */
export { getFileList, uploadFile, deleteFile, updateFile, getFileStats, getFileDownloadUrl } from "@/features/upload/services/uploads-api";
```

- [ ] **Step 3: 提交**

```bash
git add src/features/upload/services/uploads-api.ts src/features/project/services/uploads-api.ts
git commit -m "feat: migrate uploads-api to upload feature"
```

---

## Task 3: 迁移 useUploads hook 和 queryKeys

**Files:**
- Create: `src/features/upload/hooks/useUploads.ts`
- Create: `src/features/upload/queryKeys.ts`
- Modify: `src/features/project/hooks/useUploads.ts` — 删除
- Modify: `src/features/upload/services/uploads-api.ts` — import 路径调整（已在 Task 2 中处理）

- [ ] **Step 1: 创建 queryKeys.ts**

创建 `src/features/upload/queryKeys.ts`：

```typescript
/**
 * Upload feature 的 React Query query keys
 */

export const uploadQueryKeys = {
  all: ["uploads"] as const,
  fileList: (params: Record<string, unknown>) => ["uploads", "files", params] as const,
  stats: (projectId: string | null | undefined) => ["uploads", "stats", projectId] as const,
};
```

- [ ] **Step 2: 创建 useUploads.ts（从 project 原样移入，注意 import 路径变化）**

创建 `src/features/upload/hooks/useUploads.ts`：

```typescript
import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFileList, uploadFile, deleteFile, updateFile, getFileStats } from "@/features/upload/services/uploads-api";
import type {
  FileCategory,
  FileListParams,
  ProjectFile,
  FileUploadResponse,
} from "@/features/upload/types/uploads";
import { uploadQueryKeys } from "@/features/upload/queryKeys";

interface UseUploadsOptions {
  projectId: string | null | undefined;
  pageSize?: number;
}

interface UploadProgress {
  clientId?: string;
  fileId: string;
  fileName: string;
  percent: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

interface UploadMutationPayload {
  file: File;
  category: FileCategory;
  description?: string;
  tags?: string[];
  clientId?: string;
}

export function useUploads({ projectId, pageSize = 10 }: UseUploadsOptions) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<FileCategory | undefined>();
  const [keyword, setKeyword] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const listParams: FileListParams | null = useMemo(() => {
    if (!projectId) return null;
    return {
      projectId,
      category,
      keyword: keyword || undefined,
      page,
      pageSize,
    };
  }, [projectId, category, keyword, page, pageSize]);

  const fileListQuery = useQuery({
    queryKey: uploadQueryKeys.fileList(listParams ?? {}),
    queryFn: async () => {
      if (!listParams) {
        throw new Error("缺少项目 ID");
      }
      return getFileList(listParams);
    },
    enabled: Boolean(listParams),
    refetchOnWindowFocus: false,
  });

  const statsQuery = useQuery({
    queryKey: uploadQueryKeys.stats(projectId),
    queryFn: async () => {
      if (!projectId) {
        throw new Error("缺少项目 ID");
      }
      return getFileStats(projectId);
    },
    enabled: Boolean(projectId),
    refetchOnWindowFocus: false,
  });

  const uploadMutation = useMutation<FileUploadResponse, Error, UploadMutationPayload>({
    mutationFn: async (payload) => {
      const fileId = `upload-${Date.now()}`;

      setUploadProgress((prev) => [
        ...prev,
        {
          clientId: payload.clientId,
          fileId,
          fileName: payload.file.name,
          percent: 0,
          status: "uploading",
        },
      ]);

      try {
        const result = await uploadFile(payload, (percent) => {
          setUploadProgress((prev) =>
            prev.map((p) => (p.fileId === fileId ? { ...p, percent, status: "uploading" } : p)),
          );
        });

        setUploadProgress((prev) =>
          prev.map((p) => (p.fileId === fileId ? { ...p, percent: 100, status: "completed" } : p)),
        );

        setTimeout(() => {
          setUploadProgress((prev) => prev.filter((p) => p.fileId !== fileId));
        }, 3000);

        return result;
      } catch (error) {
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileId === fileId
              ? {
                  ...p,
                  status: "error",
                  error: error instanceof Error ? error.message : "上传失败",
                }
              : p,
          ),
        );
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["uploads", "files", { projectId }],
      });
      void queryClient.invalidateQueries({
        queryKey: ["uploads", "stats", projectId],
      });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (fileId) => {
      if (!projectId) {
        throw new Error("缺少项目 ID");
      }
      await deleteFile({ projectId, fileId });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["uploads", "files", { projectId }],
      });
      void queryClient.invalidateQueries({
        queryKey: ["uploads", "stats", projectId],
      });
    },
  });

  const updateMutation = useMutation<
    ProjectFile,
    Error,
    {
      fileId: string;
      name?: string;
      description?: string;
      category?: FileCategory;
      tags?: string[];
    }
  >({
    mutationFn: updateFile,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["uploads", "files", { projectId }],
      });
      void queryClient.invalidateQueries({
        queryKey: ["uploads", "stats", projectId],
      });
    },
  });

  const clearProgress = useCallback(() => {
    setUploadProgress((prev) =>
      prev.filter((p) => p.status === "uploading" || p.status === "pending"),
    );
  }, []);

  const resetFilters = useCallback(() => {
    setCategory(undefined);
    setKeyword("");
    setPage(1);
  }, []);

  return {
    files: fileListQuery.data?.list ?? [],
    total: fileListQuery.data?.total ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((fileListQuery.data?.total ?? 0) / pageSize),
    stats: statsQuery.data,
    uploadProgress,

    category,
    keyword,

    isLoading: fileListQuery.isLoading || statsQuery.isLoading,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,

    setPage,
    setCategory,
    setKeyword,
    uploadFile: uploadMutation.mutateAsync,
    deleteFile: deleteMutation.mutateAsync,
    updateFile: updateMutation.mutateAsync,
    clearProgress,
    resetFilters,
    refetch: () => {
      void fileListQuery.refetch();
      void statsQuery.refetch();
    },
  };
}

export type UseUploadsReturn = ReturnType<typeof useUploads>;
```

- [ ] **Step 3: 删除 project 的 useUploads.ts**

删除 `src/features/project/hooks/useUploads.ts`

- [ ] **Step 4: 提交**

```bash
git add src/features/upload/hooks/useUploads.ts src/features/upload/queryKeys.ts
git rm src/features/project/hooks/useUploads.ts
git commit -m "feat: migrate useUploads hook and queryKeys to upload feature"
```

---

## Task 4: 迁移 UploadPage 和更新 barrel

**Files:**
- Create: `src/features/upload/pages/UploadPage.tsx`
- Create: `src/features/upload/index.ts`
- Modify: `src/features/project/index.ts` — re-export from upload
- Modify: `src/features/project/components/UploadsTab.tsx` — import 路径调整
- Modify: `src/routes/AppRoutes.tsx:11` — UploadPage import 路径
- Delete: `src/pages/Upload.tsx`

- [ ] **Step 1: 创建 UploadPage.tsx（从 src/pages/Upload.tsx 原样移入）**

将 `src/pages/Upload.tsx` 全部内容复制到 `src/features/upload/pages/UploadPage.tsx`，注意：
- 函数名改为 `UploadPage`（已是 UploadPage）
- export 保持 `export default UploadPage`
- import `useUploads` 路径改为 `@/features/upload`
- import `FILE_CATEGORY_LABELS` 路径改为 `@/features/upload`

- [ ] **Step 2: 创建 upload feature barrel index.ts**

创建 `src/features/upload/index.ts`：

```typescript
// Upload Feature Module
// 文件上传与项目管理入口功能

export { UploadPage } from "./pages/UploadPage";

export { useUploads, type UseUploadsReturn } from "./hooks/useUploads";
export { uploadQueryKeys } from "./queryKeys";

export {
  getFileList,
  uploadFile,
  deleteFile,
  updateFile,
  getFileStats,
  getFileDownloadUrl,
} from "./services/uploads-api";

export type {
  FileCategory,
  FileStatus,
  ProjectFile,
  FileUploadPayload,
  FileUploadResponse,
  FileListParams,
  FileListResponse,
  FileDeletePayload,
  FileUpdatePayload,
  FileCategoryStat,
  FileStatsResponse,
} from "./types/uploads";
export { FILE_CATEGORY_LABELS, FILE_CATEGORY_ICONS } from "./types/uploads";
```

- [ ] **Step 3: 更新 project 的 index.ts**

将 project 的 index.ts 中 upload 相关 export 改为从 upload feature re-export：

```typescript
// Project Feature Module
// 项目相关功能统一导出

export { Overview } from "./pages/Overview";

export { useProject } from "./hooks/useProject";
export { useProjectExport } from "./hooks/useProjectExport";
export { useProjectCharts } from "./hooks/useProjectCharts";
export { useProjectData } from "./hooks/useProjectData";
export { projectQueryKeys } from "./queryKeys";

export { ProjectTrendChart } from "./components/ProjectTrendChart";
export { ProjectTabBar } from "./components/ProjectTabBar";
export { UploadsTab } from "./components/UploadsTab";

// Re-export from upload feature for backwards compatibility
export {
  useUploads,
  type UseUploadsReturn,
  uploadQueryKeys,
  getFileList,
  uploadFile,
  deleteFile,
  updateFile,
  getFileStats,
  getFileDownloadUrl,
  FILE_CATEGORY_LABELS,
  FILE_CATEGORY_ICONS,
  type FileCategory,
  type FileStatus,
  type ProjectFile,
  type FileUploadPayload,
  type FileUploadResponse,
  type FileListParams,
  type FileListResponse,
  type FileDeletePayload,
  type FileUpdatePayload,
  type FileCategoryStat,
  type FileStatsResponse,
} from "@/features/upload";

export {
  getProjectList,
  getProcessInfo,
  getProjectCoreGraph,
  getProjectCostCurve,
  getProjectHeadcountCurve,
  createJiuanProject,
  selectSolution,
} from "./services/project-api";
```

- [ ] **Step 4: 更新 UploadsTab import 路径**

检查 `src/features/project/components/UploadsTab.tsx` 的 import，确保它从 `@/features/upload` 导入（而不是从 `@/features/project` 导入 upload 相关内容）。由于 Task 3 已将 useUploads 的 import 路径在 useUploads.ts 内部改好，这里只需要确认 UploadsTab.tsx 自己的 import 是正确的。

如果 UploadsTab.tsx 中有 `import { useUploads } from "@/features/project"` 或 `import { FILE_CATEGORY_LABELS } from "@/features/project"`，改为：
```typescript
import { useUploads } from "@/features/upload";
import { FILE_CATEGORY_LABELS } from "@/features/upload";
```

- [ ] **Step 5: 更新 AppRoutes.tsx**

将 `src/routes/AppRoutes.tsx:11` 从：
```typescript
const UploadPage = lazy(() => import("@/pages/Upload"));
```
改为：
```typescript
const UploadPage = lazy(() => import("@/features/upload/pages/UploadPage"));
```

同时删除顶部的 `import { APP_DEFAULT_TITLE } from "@/config"` 后的 `UploadPage` import（已在 lazy 中处理）。

- [ ] **Step 6: 删除 src/pages/Upload.tsx**

```bash
git rm src/pages/Upload.tsx
```

- [ ] **Step 7: 提交**

```bash
git add src/features/upload/pages/UploadPage.tsx src/features/upload/index.ts
git add src/features/project/index.ts
git add src/features/project/components/UploadsTab.tsx
git add src/routes/AppRoutes.tsx
git rm src/pages/Upload.tsx
git commit -m "feat: migrate UploadPage to upload feature and wire barrel exports"
```

---

## Task 5: 最终检查

- [ ] **Step 1: 运行 lint + typecheck**

```bash
pnpm lint && pnpm typecheck
```

- [ ] **Step 2: 验证构建**

```bash
pnpm build
```

- [ ] **Step 3: 如有问题，修复后提交**

---

## 依赖关系

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5
```

Task 4 必须在 Task 1-3 完成后进行，因为 barrel 需要引用已迁移的类型和服务。
