import { API_BASE } from "@/config";
import { request, buildUrl } from "@/services/http";
import type {
  CreateJiuanProjectPayload,
  CreateJiuanProjectResponse,
  CoreGraphResponse,
  CostCurveResponse,
  HeadcountCurveResponse,
  CostCurvePoint,
  HeadcountCurvePoint,
  SelectSolutionPayload,
  SelectSolutionResponse,
} from "@/types/domain/schedulepro";
import type { ProcessInfoResponse, ProjectListResponse, Project } from "../types";

const BACKEND_BASE_URL = API_BASE.backend;
const API_V1 = `${BACKEND_BASE_URL}/api/v1`;

// ============================================================================
// 项目列表与基础信息
// ============================================================================

export async function getProjectList(): Promise<ProjectListResponse> {
  return request<ProjectListResponse>(`${API_V1}/projects`);
}

export async function getProcessInfo(
  projectId: string,
  options?: { workProcessName?: string },
): Promise<ProcessInfoResponse> {
  const url = buildUrl(BACKEND_BASE_URL, "/process_info", {
    project_id: projectId,
    work_process_name: options?.workProcessName ?? "",
  });
  return request<ProcessInfoResponse>(url, { unwrap: false });
}

// ============================================================================
// 项目核心数据 (Core Graph & Curves)
// ============================================================================

export async function getProjectCoreGraph(projectId: string): Promise<CoreGraphResponse> {
  return request<CoreGraphResponse>(`${API_V1}/projects/${projectId}/graph`);
}

// 兼容旧版 API 格式 (points 数组) 和新版格式 (平铺数组)
interface LegacyCurveResponse<T extends { date: string }> {
  project_id: string;
  points: T[];
  generated_at?: string;
}

type LegacyCostCurveResponse = LegacyCurveResponse<CostCurvePoint>;
type LegacyHeadcountCurveResponse = LegacyCurveResponse<HeadcountCurvePoint>;

function normalizeCostCurveResponse(
  payload: CostCurveResponse | LegacyCostCurveResponse,
): CostCurveResponse {
  // 新版格式直接返回
  if ("dates" in payload && "total_costs" in payload) {
    return payload;
  }
  // 旧版格式转换
  const points = payload.points ?? [];
  return {
    project_id: payload.project_id,
    days: points.map((_: CostCurvePoint, index: number) => index + 1),
    dates: points.map((p: CostCurvePoint) => p.date),
    total_costs: points.map((p: CostCurvePoint) => p.total_cost),
    material_costs: points.map((p: CostCurvePoint) => p.material_cost ?? 0),
    floating_costs: points.map((p: CostCurvePoint) => p.floating_cost ?? 0),
    generated_at: payload.generated_at,
  };
}

function normalizeHeadcountCurveResponse(
  payload: HeadcountCurveResponse | LegacyHeadcountCurveResponse,
): HeadcountCurveResponse {
  // 新版格式直接返回
  if ("dates" in payload && "headcounts" in payload) {
    return payload;
  }
  // 旧版格式转换
  const points = payload.points ?? [];
  return {
    project_id: payload.project_id,
    days: points.map((_: HeadcountCurvePoint, index: number) => index + 1),
    dates: points.map((p: HeadcountCurvePoint) => p.date),
    headcounts: points.map((p: HeadcountCurvePoint) => p.headcount),
    generated_at: payload.generated_at,
  };
}

export async function getProjectCostCurve(projectId: string): Promise<CostCurveResponse> {
  const response = await request<CostCurveResponse | LegacyCostCurveResponse>(
    `${API_V1}/projects/${projectId}/cost-curve`,
  );
  return normalizeCostCurveResponse(response);
}

export async function getProjectHeadcountCurve(projectId: string): Promise<HeadcountCurveResponse> {
  const response = await request<HeadcountCurveResponse | LegacyHeadcountCurveResponse>(
    `${API_V1}/projects/${projectId}/headcount-curve`,
  );
  return normalizeHeadcountCurveResponse(response);
}

// ============================================================================
// 项目创建与方案选择
// ============================================================================

export async function createJiuanProject(
  payload: CreateJiuanProjectPayload,
): Promise<CreateJiuanProjectResponse> {
  return request<CreateJiuanProjectResponse>(`${API_V1}/projects/jiuan`, {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function selectSolution(
  projectId: string,
  payload: SelectSolutionPayload,
): Promise<SelectSolutionResponse> {
  return request<SelectSolutionResponse>(`${API_V1}/projects/${projectId}/solutions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// 项目引导 (Bootstrap)
// ============================================================================

const DEFAULT_SOLUTION_ID = 0;

function createRandomProjectName() {
  return `项目_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export async function createProjectWithDefaultSolution(): Promise<Project> {
  const response = await createJiuanProject({ project_name: createRandomProjectName() });
  await selectSolution(response.project_id, { solution_id: DEFAULT_SOLUTION_ID });

  return {
    id: response.project_id,
    name: response.project_name,
    status: response.status,
  };
}
