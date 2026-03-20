import { requestJson, buildUrl, requestApiData } from "@/services/http";
import { API_BASE } from "@/config";
import type {
  ProcessInfoResponse,
  ProjectListResponse,
  ProjectByCodeResponse,
} from "@/types/domain/project";

const PROJECT_SERVICE_BASE_URL = API_BASE.projectService;

// ----------- Types -----------
// Types are now imported from @/types/domain/project

export async function getProcessInfo(
  projectId: string,
  token?: string,
  options?: { workProcessName?: string },
): Promise<ProcessInfoResponse> {
  const url = buildUrl(PROJECT_SERVICE_BASE_URL, "/process_info", {
    project_id: projectId,
    work_process_name: options?.workProcessName ?? "",
  });
  return requestJson<ProcessInfoResponse>(url, { token });
}

export async function getProjectList(
  token?: string,
): Promise<ProjectListResponse> {
  return requestApiData<ProjectListResponse>(
    `${PROJECT_SERVICE_BASE_URL}/api/v1/projects`,
    { token },
  );
}

export async function getProjectByCode(
  projectCode: string,
  token?: string,
): Promise<ProjectByCodeResponse> {
  return requestApiData<ProjectByCodeResponse>(
    `${PROJECT_SERVICE_BASE_URL}/api/v1/projects/by-code/${projectCode}`,
    { token },
  );
}
