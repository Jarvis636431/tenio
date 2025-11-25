import { TOKEN_STORAGE_KEY } from "@/services/user-service";

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
              .map((item: any) => item?.msg)
              .filter(Boolean)
              .join("; ")
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

export interface ScheduleRow {
  背景?: string;
  序号?: number | string;
  施工工序?: string;
  施工方式?: string;
  施工情况?: string;
  施工情况系数?: number[] | string;
  工期?: number | string;
  开始时间?: string;
  结束时间?: string;
  持续时长?: string;
  实际工作天数?: string | number;
  直接依赖任务?: string;
  highlight_ids?: Array<number | string>;
  [key: string]: unknown;
}

export interface ProjectInfoRow {
  [key: string]: unknown;
}

export interface ProjectDetailResponse {
  filename: string;
  schedule: ScheduleRow[];
  project_info: ProjectInfoRow[];
  process_guid_mapping?: Record<string, Array<number | string>>;
}

export interface ProcessGuidMappingResponse {
  project_id: string;
  process_guid_mapping: Record<string, Array<number | string>>;
}

export interface ShutdownEventTime {
  day: number;
  hour: number;
}

export interface ShutdownEventConfig {
  name: string;
  start_time: ShutdownEventTime;
  end_time: ShutdownEventTime;
  a_level_tasks: string[];
  b_level_tasks: string[];
  [key: string]: unknown;
}

export interface ConstructionMethodConfig {
  task_name: string;
  method_index: number;
  [key: string]: unknown;
}

export interface CompressStrategyConfig {
  target_days: number;
  add_carpenter_first: boolean;
  [key: string]: unknown;
}

export interface ProjectConfig {
  construction_methods: ConstructionMethodConfig[];
  overtime_tasks: string[];
  shutdown_events: ShutdownEventConfig[];
  work_start_hour: number;
  work_end_hour: number;
  backgrounds: string[];
  compress: CompressStrategyConfig;
  [key: string]: unknown;
}

export interface ProjectConfigResponse {
  project_id: string;
  name?: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  config: ProjectConfig;
  [key: string]: unknown;
}

export interface TimeSeriesData<T extends number | string = number> {
  name: string;
  date?: T[];
  data: number[];
  [key: string]: unknown;
}

export type CrewData = TimeSeriesData<number>;
export type BudgetData = TimeSeriesData<number>;

export interface ProcessInfoData {
  [key: string]: unknown;
  施工工序?: string;
  持续时间?: string;
  开始时间?: string;
  结束时间?: string;
  施工人数?: number;
  施工工种?: string;
  人工成本?: number;
  拆单名称?: string;
}

export interface OrderInfoData {
  [key: string]: unknown;
  工单内容?: string;
  详细信息?: string;
  节点大样图?: string;
  设计交底?: string;
  安全交底?: string;
  技术验收标准?: string;
  构件?: string[];
  视频?: string;
}

export interface ProcessInfoResponse {
  process_info?: ProcessInfoData;
  order_info?: OrderInfoData;
}

export interface ProjectListItem {
  project_id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
}

export interface ProjectListResponse {
  result: ProjectListItem[];
}

export interface AddProcessPayload {
  project_id: string;
  construction_process: string;
  duration: number;
  construction_method?: string;
  workers_count?: number;
  work_type?: string;
  predecessor_processes?: string;
  successor_processes?: string;
  description?: string;
}

export interface AddProcessResponse {
  status: string;
  message: string;
  file_url?: string;
  filename?: string;
  version_num?: number;
  final_days?: number;
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

export async function getProjectDetail(
  projectId: string,
  token?: string
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
  options?: { workProcessName?: string }
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
  userId?: string
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
  token?: string
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
  token?: string
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
  token?: string
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
  token?: string
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
  token?: string
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
