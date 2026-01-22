import { TOKEN_STORAGE_KEY } from "@/services/user-service";
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

const PROJECT_SERVICE_BASE_URL =
  import.meta.env.VITE_PROJECT_SERVICE_URL?.replace(/\/$/, "") ||
  "http://localhost:8002";

function authHeaders(token?: string) {
  const resolvedToken = token ?? localStorage.getItem(TOKEN_STORAGE_KEY);
  return resolvedToken
    ? {
        Authorization: `Bearer ${resolvedToken}`,
      }
    : {};
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return {} as T;
    }
    return response.json() as Promise<T>;
  }

  try {
    const data = await response.json();
    if (data?.message) {
      throw new Error(data.message);
    }
    if (data?.error?.message) {
      throw new Error(data.error.message);
    }
    if (data?.detail) {
      throw new Error(
        Array.isArray(data.detail)
          ? data.detail
              .map((item: { msg?: string }) => item?.msg)
              .filter(Boolean)
              .join("; ")
          : data.detail,
      );
    }
  } catch (parseError) {
    throw new Error(`请求失败 (${response.status})`);
  }
  throw new Error(`请求失败 (${response.status})`);
}

// ----------- Types -----------
// Types are now imported from @/types/domain/project

// ----------- API wrappers -----------

export async function precreateProject(
  payload: PrecreateProjectPayload,
  token?: string,
): Promise<PrecreateProjectResponse> {
  const response = await fetch(`${PROJECT_SERVICE_BASE_URL}/precreate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<PrecreateProjectResponse>(response);
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

  const response = await fetch(`${PROJECT_SERVICE_BASE_URL}/upload_docs`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
    },
    body: formData,
  });

  return parseResponse<UploadDocsResponse>(response);
}

export async function getProjectDetail(
  projectId: string,
  token?: string,
): Promise<ProjectDetailResponse> {
  const url = new URL(`${PROJECT_SERVICE_BASE_URL}/view`);
  url.searchParams.set("project_id", projectId);

  const response = await fetch(url.toString(), {
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<ProjectDetailResponse>(response);
}

export async function getProcessInfo(
  projectId: string,
  token?: string,
  options?: { workProcessName?: string },
): Promise<ProcessInfoResponse> {
  const url = new URL(`${PROJECT_SERVICE_BASE_URL}/process_info`);
  if (projectId) {
    url.searchParams.set("project_id", projectId);
  }
  if (options?.workProcessName) {
    url.searchParams.set("work_process_name", options.workProcessName);
  }

  const response = await fetch(url.toString(), {
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<ProcessInfoResponse>(response);
}

export async function getProjectList(
  token?: string,
  userId?: string,
): Promise<ProjectListResponse> {
  const url = new URL(`${PROJECT_SERVICE_BASE_URL}/project_list`);
  if (userId) {
    url.searchParams.set("user_id", userId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<ProjectListResponse>(response);
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

  const response = await fetch(`${PROJECT_SERVICE_BASE_URL}/add_process`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
    },
    body: formData,
  });

  return parseResponse<AddProcessResponse>(response);
}

export async function getProjectConfig(
  projectId: string,
  token?: string,
): Promise<ProjectConfigResponse> {
  const url = new URL(`${PROJECT_SERVICE_BASE_URL}/project_config`);
  url.searchParams.set("project_id", projectId);

  const response = await fetch(url.toString(), {
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<ProjectConfigResponse>(response);
}

export async function getProcessGuidMapping(
  projectId: string,
  token?: string,
): Promise<ProcessGuidMappingResponse> {
  const url = new URL(`${PROJECT_SERVICE_BASE_URL}/process_guid_mapping`);
  url.searchParams.set("project_id", projectId);

  const response = await fetch(url.toString(), {
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<ProcessGuidMappingResponse>(response);
}

export async function getCrewData(
  projectId: string,
  token?: string,
): Promise<CrewData[]> {
  const url = new URL(`${PROJECT_SERVICE_BASE_URL}/crew`);
  url.searchParams.set("project_id", projectId);

  const response = await fetch(url.toString(), {
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<CrewData[]>(response);
}

export async function getBudgetData(
  projectId: string,
  token?: string,
): Promise<BudgetData[]> {
  const url = new URL(`${PROJECT_SERVICE_BASE_URL}/budget`);
  url.searchParams.set("project_id", projectId);

  const response = await fetch(url.toString(), {
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<BudgetData[]>(response);
}
