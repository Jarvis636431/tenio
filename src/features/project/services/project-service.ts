import { requestJson, buildUrl, requestApiData } from "@/services/http";
import { API_BASE } from "@/config";
import type { ProcessInfoResponse, ProjectListResponse } from "@/types/domain/project";

const BACKEND_BASE_URL = API_BASE.backend;

// ----------- Types -----------
// Types are now imported from @/types/domain/project

export async function getProcessInfo(
  projectId: string,
  options?: { workProcessName?: string },
): Promise<ProcessInfoResponse> {
  const url = buildUrl(BACKEND_BASE_URL, "/process_info", {
    project_id: projectId,
    work_process_name: options?.workProcessName ?? "",
  });
  return requestJson<ProcessInfoResponse>(url);
}

export async function getProjectList(): Promise<ProjectListResponse> {
  return requestApiData<ProjectListResponse>(`${BACKEND_BASE_URL}/api/v1/projects`);
}
