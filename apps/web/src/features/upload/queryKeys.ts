import type { FileListParams } from "./types/uploads";

function normalizeFileListParams(params?: FileListParams | null) {
  return {
    projectId: params?.projectId ?? "",
    category: params?.category ?? "",
    keyword: params?.keyword ?? "",
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 10,
  };
}

export const uploadQueryKeys = {
  all: ["uploads"] as const,
  files: ["uploads", "files"] as const,
  fileList: (params?: FileListParams | null) =>
    ["uploads", "files", normalizeFileListParams(params)] as const,
  stats: (projectId: string | null | undefined) => ["uploads", "stats", projectId] as const,
};
