import { API_BASE } from "@/config";
import { requestApiData } from "@/services/http";
import type {
  AuthLoginPayload,
  AuthRegisterPayload,
  AuthTokenResponse,
  AuthMeResponse,
  CreateJiuanProjectPayload,
  CreateJiuanProjectResponse,
  SelectSolutionPayload,
  SelectSolutionResponse,
  CoreGraphResponse,
  CostCurveResponse,
  HeadcountCurveResponse,
} from "@/types/domain/schedulepro";

const BASE_URL = API_BASE.projectService;
const API_V1 = `${BASE_URL}/api/v1`;

// Auth
export async function registerUser(
  payload: AuthRegisterPayload,
): Promise<AuthTokenResponse> {
  return requestApiData<AuthTokenResponse>(`${API_V1}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function loginUser(
  payload: AuthLoginPayload,
): Promise<AuthTokenResponse> {
  return requestApiData<AuthTokenResponse>(`${API_V1}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUserProfile(
  token?: string,
): Promise<AuthMeResponse> {
  return requestApiData<AuthMeResponse>(`${API_V1}/auth/me`, { token });
}

// Projects (Jiuan mode)
export async function createJiuanProject(
  payload: CreateJiuanProjectPayload,
  token?: string,
): Promise<CreateJiuanProjectResponse> {
  return requestApiData<CreateJiuanProjectResponse>(`${API_V1}/projects`, {
    token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function selectProjectSolution(
  projectId: string,
  payload: SelectSolutionPayload,
  token?: string,
): Promise<SelectSolutionResponse> {
  return requestApiData<SelectSolutionResponse>(
    `${API_V1}/projects/${projectId}/solutions`,
    {
      token,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function getProjectCoreGraph(
  projectId: string,
  token?: string,
): Promise<CoreGraphResponse> {
  return requestApiData<CoreGraphResponse>(
    `${API_V1}/projects/${projectId}/graph`,
    { token },
  );
}

export async function getProjectCostCurve(
  projectId: string,
  token?: string,
): Promise<CostCurveResponse> {
  return requestApiData<CostCurveResponse>(
    `${API_V1}/projects/${projectId}/cost-curve`,
    { token },
  );
}

export async function getProjectHeadcountCurve(
  projectId: string,
  token?: string,
): Promise<HeadcountCurveResponse> {
  return requestApiData<HeadcountCurveResponse>(
    `${API_V1}/projects/${projectId}/headcount-curve`,
    { token },
  );
}
