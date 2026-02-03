import { requestJson, buildUrl } from "@/services/http";
import { API_BASE } from "@/config";
import type {
  PrecreateProjectPayload,
  PrecreateProjectResponse,
  UploadDocsResponse,
  ProjectDetailResponse,
  ProcessGuidMappingResponse,
  ProjectConfigResponse,
  CrewData,
  BudgetData,
  ProcessInfoResponse,
  ProjectListResponse,
  AddProcessPayload,
  AddProcessResponse,
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

export async function getProjectDetail(
  projectId: string,
  token?: string,
): Promise<ProjectDetailResponse> {
  const url = buildUrl(PROJECT_SERVICE_BASE_URL, "/view", {
    project_id: projectId,
  });
  return requestJson<ProjectDetailResponse>(url, { token });
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
  return requestJson<ProjectListResponse>(
    `${PROJECT_SERVICE_BASE_URL}/api/projects/`,
    { token },
  );
}

export async function addProcess(
  payload: AddProcessPayload,
  token?: string,
): Promise<AddProcessResponse> {
  const formData = new FormData();
  formData.append("project_id", payload.project_id);
  formData.append("construction_process", payload.construction_process);
  formData.append("duration", payload.duration.toString());

  if (payload.construction_method) {
    formData.append("construction_method", payload.construction_method);
  }
  if (typeof payload.workers_count === "number") {
    formData.append("workers_count", payload.workers_count.toString());
  }
  if (payload.work_type) {
    formData.append("work_type", payload.work_type);
  }
  if (payload.predecessor_processes) {
    formData.append("predecessor_processes", payload.predecessor_processes);
  }
  if (payload.successor_processes) {
    formData.append("successor_processes", payload.successor_processes);
  }
  if (payload.description) {
    formData.append("description", payload.description);
  }

  return requestJson<AddProcessResponse>(
    `${PROJECT_SERVICE_BASE_URL}/add_process`,
    {
      token,
      body: formData,
    },
  );
}

export async function getProjectConfig(
  projectId: string,
  token?: string,
): Promise<ProjectConfigResponse> {
  const url = buildUrl(PROJECT_SERVICE_BASE_URL, "/project_config", {
    project_id: projectId,
  });
  return requestJson<ProjectConfigResponse>(url, { token });
}

export async function getProcessGuidMapping(
  projectId: string,
  token?: string,
): Promise<ProcessGuidMappingResponse> {
  const url = buildUrl(PROJECT_SERVICE_BASE_URL, "/process_guid_mapping", {
    project_id: projectId,
  });
  return requestJson<ProcessGuidMappingResponse>(url, { token });
}

export async function getCrewData(
  projectId: string,
  token?: string,
): Promise<CrewData[]> {
  const url = buildUrl(PROJECT_SERVICE_BASE_URL, "/crew", {
    project_id: projectId,
  });
  return requestJson<CrewData[]>(url, { token });
}

export async function getBudgetData(
  projectId: string,
  token?: string,
): Promise<BudgetData[]> {
  const url = buildUrl(PROJECT_SERVICE_BASE_URL, "/budget", {
    project_id: projectId,
  });
  return requestJson<BudgetData[]>(url, { token });
}
