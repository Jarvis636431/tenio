import type { ProjectListParams } from "./types";

function normalizeListParams(params: ProjectListParams = {}) {
  return {
    status: params.status ?? "",
    keyword: params.keyword ?? "",
    page: params.page ?? 1,
    page_size: params.page_size ?? 20,
  };
}

export const projectQueryKeys = {
  metrics: ["projects", "metrics"] as const,
  list: (params?: ProjectListParams) => ["projects", "list", normalizeListParams(params)] as const,
  scheduleArtifact: (projectId: string) => ["project", "artifact", "schedule", projectId] as const,
  timeCostArtifact: (projectId: string) => ["project", "artifact", "time-cost", projectId] as const,
};
