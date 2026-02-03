import { API_BASE } from "@/config";
import { buildUrl, requestJson } from "@/services/http";
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
  TeamAssignmentsResponse,
  CompressionStartPayload,
  CompressionStartResponse,
  CompressionStatusResponse,
} from "@/types/domain/schedulepro";

const BASE_URL = API_BASE.projectService;

// Auth
export async function registerUser(
  payload: AuthRegisterPayload,
): Promise<AuthTokenResponse> {
  return requestJson<AuthTokenResponse>(`${BASE_URL}/api/auth/register`, {
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
  return requestJson<AuthTokenResponse>(`${BASE_URL}/api/auth/login`, {
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
  return requestJson<AuthMeResponse>(`${BASE_URL}/api/auth/me`, { token });
}

// Projects (Jiuan mode)
export async function createJiuanProject(
  payload: CreateJiuanProjectPayload,
  token?: string,
): Promise<CreateJiuanProjectResponse> {
  return requestJson<CreateJiuanProjectResponse>(`${BASE_URL}/api/projects/jiuan`, {
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
  return requestJson<SelectSolutionResponse>(
    `${BASE_URL}/api/projects/${projectId}/select-solution`,
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
  return requestJson<CoreGraphResponse>(
    `${BASE_URL}/api/projects/${projectId}/graph`,
    { token },
  );
}

export async function getProjectCostCurve(
  projectId: string,
  token?: string,
): Promise<CostCurveResponse> {
  return requestJson<CostCurveResponse>(
    `${BASE_URL}/api/projects/${projectId}/cost-curve`,
    { token },
  );
}

export async function getTeamAssignments(
  projectId: string,
  token?: string,
): Promise<TeamAssignmentsResponse> {
  return requestJson<TeamAssignmentsResponse>(
    `${BASE_URL}/api/projects/${projectId}/team-assignments`,
    { token },
  );
}

// Compression
export async function startCompression(
  projectId: string,
  payload: CompressionStartPayload,
  token?: string,
): Promise<CompressionStartResponse> {
  return requestJson<CompressionStartResponse>(
    `${BASE_URL}/api/projects/${projectId}/compress`,
    {
      token,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function getCompressionStatus(
  projectId: string,
  runId: string,
  token?: string,
): Promise<CompressionStatusResponse> {
  return requestJson<CompressionStatusResponse>(
    `${BASE_URL}/api/projects/${projectId}/compress/${runId}`,
    { token },
  );
}
