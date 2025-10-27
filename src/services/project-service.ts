import { TOKEN_STORAGE_KEY } from "@/services/user-service";

const PROJECT_SERVICE_BASE_URL =
  import.meta.env.VITE_PROJECT_SERVICE_URL?.replace(/\/$/, "") || "http://localhost:8002";

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
          ? data.detail.map((item: any) => item?.msg).filter(Boolean).join("; ")
          : data.detail
      );
    }
  } catch (parseError) {
    throw new Error(`请求失败 (${response.status})`);
  }
  throw new Error(`请求失败 (${response.status})`);
}

// ----------- Types -----------

export interface PrecreateProjectPayload {
  name: string;
  description?: string;
  user_id?: string;
}

export interface PrecreateProjectResponse {
  project_id: string;
  status: string;
}

export interface UploadDocsResponse {
  uploaded_files: string[];
  parse_ids: string[];
}

export interface ProjectDetailResponse {
  project_id: string;
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface ProcessInfoResponse {
  // 文档未提供字段，留作泛型对象
  [key: string]: unknown;
}

export interface ProjectListItem {
  project_id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
}

export interface ProjectListResponse {
  projects: ProjectListItem[];
}

// ----------- API wrappers -----------

export async function precreateProject(
  payload: PrecreateProjectPayload,
  token?: string
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

export interface UploadDocsPayload {
  project_id: string;
  files: File[];
  file_type: "ifc" | "excel" | "workvolume" | string;
}

export async function uploadProjectDocs(
  payload: UploadDocsPayload,
  token?: string
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

export async function getProjectDetail(projectId: string, token?: string): Promise<ProjectDetailResponse> {
  const url = new URL(`${PROJECT_SERVICE_BASE_URL}/view`);
  url.searchParams.set("project_id", projectId);

  const response = await fetch(url.toString(), {
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<ProjectDetailResponse>(response);
}

export async function getProcessInfo(projectId: string, token?: string): Promise<ProcessInfoResponse> {
  const url = new URL(`${PROJECT_SERVICE_BASE_URL}/process_info`);
  if (projectId) {
    url.searchParams.set("project_id", projectId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<ProcessInfoResponse>(response);
}

export async function getProjectList(token?: string, userId?: string): Promise<ProjectListResponse> {
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
