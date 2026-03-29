import { requestJson, buildUrl, requestApiData } from "@/services/http";
import { API_BASE } from "@/config";
import type {
  ProcessInfoResponse,
  ProjectListResponse,
  ProjectByCodeResponse,
} from "@/types/domain/project";

const BACKEND_BASE_URL = API_BASE.backend;

// ----------- Types -----------
// Types are now imported from @/types/domain/project

export async function getProcessInfo(
  projectId: string,
  token?: string,
  options?: { workProcessName?: string },
): Promise<ProcessInfoResponse> {
  const url = buildUrl(BACKEND_BASE_URL, "/process_info", {
    project_id: projectId,
    work_process_name: options?.workProcessName ?? "",
  });
  return requestJson<ProcessInfoResponse>(url, { token });
}

export async function getProjectList(token?: string): Promise<ProjectListResponse> {
  return requestApiData<ProjectListResponse>(`${BACKEND_BASE_URL}/api/v1/projects`, {
    token,
  });
}

export async function getProjectByCode(
  projectCode: string,
  token?: string,
): Promise<ProjectByCodeResponse> {
  return requestApiData<ProjectByCodeResponse>(
    `${BACKEND_BASE_URL}/api/v1/projects/by-code/${projectCode}`,
    { token },
  );
}
