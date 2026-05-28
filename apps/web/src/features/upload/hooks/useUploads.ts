import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createUploadProject,
  getFileList,
  uploadFile,
  getFileStats,
} from "../services/uploads-api";
import type { FileCategory, FileListParams, FileUploadResponse } from "../types/uploads";
import { uploadQueryKeys } from "../queryKeys";

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

/**
 * 管理项目资料上传、文件列表与上传进度。
 */
export function useUploads({ projectId, pageSize = 10 }: UseUploadsOptions) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<FileCategory | undefined>();
  const [keyword, setKeyword] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const createdProjectIdRef = useRef<string | null>(null);
  const createProjectPromiseRef = useRef<Promise<string> | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const ensureUploadProjectId = useCallback(
    async (fileName: string) => {
      if (projectId) return projectId;
      if (createdProjectIdRef.current) return createdProjectIdRef.current;

      if (!createProjectPromiseRef.current) {
        const projectName = fileName.replace(/\.[^.]+$/, "");
        createProjectPromiseRef.current = createUploadProject(projectName)
          .then((project) => {
            createdProjectIdRef.current = project.id;
            setCreatedProjectId(project.id);
            return project.id;
          })
          .finally(() => {
            createProjectPromiseRef.current = null;
          });
      }

      return createProjectPromiseRef.current;
    },
    [projectId],
  );

  // 列表查询参数
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

  // 文件列表查询
  const fileListQuery = useQuery({
    queryKey: uploadQueryKeys.fileList(listParams),
    queryFn: async () => {
      if (!listParams) {
        throw new Error("缺少项目 ID");
      }
      return getFileList(listParams);
    },
    enabled: Boolean(listParams),
    refetchOnWindowFocus: false,
  });

  // 文件统计查询
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

  // 上传文件 Mutation
  const uploadMutation = useMutation<FileUploadResponse, Error, UploadMutationPayload>({
    mutationFn: async (payload) => {
      const fileId = `upload-${Date.now()}`;

      // 添加到进度追踪
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
        const targetProjectId = await ensureUploadProjectId(payload.file.name);
        const result = await uploadFile({ ...payload, projectId: targetProjectId }, (percent) => {
          setUploadProgress((prev) =>
            prev.map((p) => (p.fileId === fileId ? { ...p, percent, status: "uploading" } : p)),
          );
        });

        // 标记完成
        setUploadProgress((prev) =>
          prev.map((p) => (p.fileId === fileId ? { ...p, percent: 100, status: "completed" } : p)),
        );

        // 清理已完成的进度（延迟）
        setTimeout(() => {
          setUploadProgress((prev) => prev.filter((p) => p.fileId !== fileId));
        }, 3000);

        return result;
      } catch (error) {
        // 标记错误
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
      // 刷新列表和统计
      void queryClient.invalidateQueries({
        queryKey: uploadQueryKeys.all,
      });
    },
  });

  // 清除已完成的进度
  const clearProgress = useCallback(() => {
    setUploadProgress((prev) =>
      prev.filter((p) => p.status === "uploading" || p.status === "pending"),
    );
  }, []);

  // 重置筛选
  const resetFilters = useCallback(() => {
    setCategory(undefined);
    setKeyword("");
    setPage(1);
  }, []);

  return {
    // 数据
    files: fileListQuery.data?.list ?? [],
    total: fileListQuery.data?.total ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((fileListQuery.data?.total ?? 0) / pageSize),
    stats: statsQuery.data,
    uploadProgress,
    createdProjectId: projectId ?? createdProjectId,

    // 筛选状态
    category,
    keyword,

    // Loading 状态
    isLoading: fileListQuery.isLoading || statsQuery.isLoading,
    isUploading: uploadMutation.isPending,

    // Actions
    setPage,
    setCategory,
    setKeyword,
    uploadFile: uploadMutation.mutateAsync,
    clearProgress,
    resetFilters,
    refetch: () => {
      void fileListQuery.refetch();
      void statsQuery.refetch();
    },
  };
}

export type UseUploadsReturn = ReturnType<typeof useUploads>;
