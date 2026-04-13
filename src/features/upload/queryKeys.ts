/**
 * Upload feature 的 React Query query keys
 */

export const uploadQueryKeys = {
  all: ["uploads"] as const,
  fileList: (params: Record<string, unknown>) => ["uploads", "files", params] as const,
  stats: (projectId: string | null | undefined) => ["uploads", "stats", projectId] as const,
};
