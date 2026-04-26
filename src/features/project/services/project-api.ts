import { API_BASE } from "@/config";
import { request } from "@/services/http";
import { listProjects } from "@/services/apm-api";
import {
  costCurveResponseSchema,
  headcountCurveResponseSchema,
  legacyCostCurveResponseSchema,
  legacyHeadcountCurveResponseSchema,
  projectListResponseSchema,
} from "./project-schema";
import type {
  CoreGraphResponse,
  CostCurveResponse,
  HeadcountCurveResponse,
  CostCurvePoint,
  HeadcountCurvePoint,
} from "@/types/domain/schedulepro";
import type { ProjectListResponse } from "@/features/project";
import type { ProjectListItem as ApmProjectListItem } from "@/services/apm-api";

const BACKEND_BASE_URL = API_BASE.backend;
const API_V1 = `${BACKEND_BASE_URL}/api/v1`;

// ============================================================================
// 项目列表与基础信息
// ============================================================================

function mapApmProjectListItem(item: ApmProjectListItem): ProjectListResponse[number] {
  return {
    project_id: item.project_id,
    project_name: item.project_name,
    description: item.location ?? item.project_type ?? item.status_label,
    status: item.status,
    created_at: item.created_at,
  };
}

/**
 * 获取项目列表。
 */
export async function getProjectList(): Promise<ProjectListResponse> {
  const response = await listProjects();
  return projectListResponseSchema.parse(response.items.map(mapApmProjectListItem));
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
    return costCurveResponseSchema.parse(payload);
  }
  // 旧版格式转换
  const parsedPayload = legacyCostCurveResponseSchema.parse(payload);
  const points = parsedPayload.points;
  return {
    project_id: parsedPayload.project_id,
    days: points.map((_: CostCurvePoint, index: number) => index + 1),
    dates: points.map((p: CostCurvePoint) => p.date),
    total_costs: points.map((p: CostCurvePoint) => p.total_cost),
    material_costs: points.map((p: CostCurvePoint) => p.material_cost ?? 0),
    floating_costs: points.map((p: CostCurvePoint) => p.floating_cost ?? 0),
    generated_at: parsedPayload.generated_at,
  };
}

function normalizeHeadcountCurveResponse(
  payload: HeadcountCurveResponse | LegacyHeadcountCurveResponse,
): HeadcountCurveResponse {
  // 新版格式直接返回
  if ("dates" in payload && "headcounts" in payload) {
    return headcountCurveResponseSchema.parse(payload);
  }
  // 旧版格式转换
  const parsedPayload = legacyHeadcountCurveResponseSchema.parse(payload);
  const points = parsedPayload.points;
  return {
    project_id: parsedPayload.project_id,
    days: points.map((_: HeadcountCurvePoint, index: number) => index + 1),
    dates: points.map((p: HeadcountCurvePoint) => p.date),
    headcounts: points.map((p: HeadcountCurvePoint) => p.headcount),
    generated_at: parsedPayload.generated_at,
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
