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
  graphArtifact: (projectId: string) => ["project", "artifact", "graph", projectId] as const,
  documentArtifact: (projectId: string) => ["project", "artifact", "document", projectId] as const,
  timeCostArtifact: (projectId: string) => ["project", "artifact", "time-cost", projectId] as const,
  crewPlanArtifact: (projectId: string) => ["project", "artifact", "crew-plan", projectId] as const,
  generationStatus: (projectId: string) => ["project", "generation", "status", projectId] as const,
  operationStatus: (projectId: string, operationId: string) =>
    ["project", "operation", projectId, operationId] as const,
  uploadSummary: (projectId: string) =>
    ["project", "workbench", "upload-summary", projectId] as const,
  consoleLogs: (projectId: string) => ["project", "workbench", "console-logs", projectId] as const,
  schemes: (projectId: string) => ["project", "schemes", projectId] as const,
};
