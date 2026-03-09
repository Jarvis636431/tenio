import { requestJson, buildUrl, requestApiData } from "@/services/http";
import { API_BASE } from "@/config";
import type {
  PrecreateProjectPayload,
  PrecreateProjectResponse,
  UploadDocsResponse,
  ProcessInfoResponse,
  ProjectListResponse,
  UploadDocsPayload,
} from "@/types/domain/project";

const PROJECT_SERVICE_BASE_URL = API_BASE.projectService;

// ----------- Types -----------
// Types are now imported from @/types/domain/project

// ----------- API wrappers -----------

export async function precreateProject(
  payload: PrecreateProjectPayload,
  token?: string,
): Promise<PrecreateProjectResponse> {
  return requestJson<PrecreateProjectResponse>(
    `${PROJECT_SERVICE_BASE_URL}/precreate`,
    {
      token,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function uploadProjectDocs(
  payload: UploadDocsPayload,
  token?: string,
): Promise<UploadDocsResponse> {
  const formData = new FormData();
  formData.append("project_id", payload.project_id);
  formData.append("file_type", payload.file_type);
  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  return requestJson<UploadDocsResponse>(
    `${PROJECT_SERVICE_BASE_URL}/upload_docs`,
    {
      token,
      body: formData,
    },
  );
}

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
