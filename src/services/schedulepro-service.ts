import { API_BASE } from "@/config";
import { requestApiData } from "@/services/http";
import type {
  AuthLoginPayload,
  AuthRegisterPayload,
  AuthTokenResponse,
  AuthMeResponse,
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

const BACKEND_BASE_URL = API_BASE.backend;
const API_V1 = `${BACKEND_BASE_URL}/api/v1`;

type LegacyCostCurveResponse = {
  project_id: string;
  points: CostCurvePoint[];
  generated_at?: string;
};

type LegacyHeadcountCurveResponse = {
  project_id: string;
  points: HeadcountCurvePoint[];
  generated_at?: string;
};

function normalizeCostCurveResponse(
  payload: CostCurveResponse | LegacyCostCurveResponse,
): CostCurveResponse {
  if ("dates" in payload && "total_costs" in payload) {
    return payload;
  }
  const points = payload.points ?? [];
  return {
    project_id: payload.project_id,
    days: points.map((_, index) => index + 1),
    dates: points.map((point) => point.date),
    total_costs: points.map((point) => point.total_cost),
    material_costs: points.map((point) => point.material_cost ?? 0),
    floating_costs: points.map((point) => point.floating_cost ?? 0),
    generated_at: payload.generated_at,
  };
}

function normalizeHeadcountCurveResponse(
  payload: HeadcountCurveResponse | LegacyHeadcountCurveResponse,
): HeadcountCurveResponse {
  if ("dates" in payload && "headcounts" in payload) {
    return payload;
  }
  const points = payload.points ?? [];
  return {
    project_id: payload.project_id,
    days: points.map((_, index) => index + 1),
    dates: points.map((point) => point.date),
    headcounts: points.map((point) => point.headcount),
    generated_at: payload.generated_at,
  };
}

// Auth
export async function registerUser(payload: AuthRegisterPayload): Promise<AuthTokenResponse> {
  return requestApiData<AuthTokenResponse>(`${API_V1}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: AuthLoginPayload): Promise<AuthTokenResponse> {
  return requestApiData<AuthTokenResponse>(`${API_V1}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUserProfile(token?: string): Promise<AuthMeResponse> {
  return requestApiData<AuthMeResponse>(`${API_V1}/auth/me`, { token });
}

// Projects (Jiuan mode)
export async function createJiuanProject(
  payload: CreateJiuanProjectPayload,
  token?: string,
): Promise<CreateJiuanProjectResponse> {
  return requestApiData<CreateJiuanProjectResponse>(`${API_V1}/projects/jiuan`, {
    token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getProjectCoreGraph(
  projectId: string,
  token?: string,
): Promise<CoreGraphResponse> {
  return requestApiData<CoreGraphResponse>(`${API_V1}/projects/${projectId}/graph`, { token });
}

export async function getProjectCostCurve(
  projectId: string,
  token?: string,
): Promise<CostCurveResponse> {
  const response = await requestApiData<CostCurveResponse | LegacyCostCurveResponse>(
    `${API_V1}/projects/${projectId}/cost-curve`,
    { token },
  );
  return normalizeCostCurveResponse(response);
}

export async function getProjectHeadcountCurve(
  projectId: string,
  token?: string,
): Promise<HeadcountCurveResponse> {
  const response = await requestApiData<HeadcountCurveResponse | LegacyHeadcountCurveResponse>(
    `${API_V1}/projects/${projectId}/headcount-curve`,
    { token },
  );
  return normalizeHeadcountCurveResponse(response);
}

// Solutions
export async function selectSolution(
  projectId: string,
  payload: SelectSolutionPayload,
  token?: string,
): Promise<SelectSolutionResponse> {
  return requestApiData<SelectSolutionResponse>(`${API_V1}/projects/${projectId}/solutions`, {
    method: "POST",
    token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
