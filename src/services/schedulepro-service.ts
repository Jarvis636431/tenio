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
  HeadcountCurveResponse,
  TaskStatusResponse,
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

export async function getProjectHeadcountCurve(
  projectId: string,
  token?: string,
): Promise<HeadcountCurveResponse> {
  return requestJson<HeadcountCurveResponse>(
    `${BASE_URL}/api/projects/${projectId}/headcount-curve`,
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

export async function getTaskStatus(
  taskId: string,
  token?: string,
): Promise<TaskStatusResponse> {
  return requestJson<TaskStatusResponse>(`${BASE_URL}/api/tasks/${taskId}/status`, {
    token,
  });
}

type CompressionPollOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  onUpdate?: (status: CompressionStatusResponse) => void;
};

function sleepWithAbort(delayMs: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Polling aborted"));
      return;
    }
    const timer = window.setTimeout(() => {
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
      resolve();
    }, delayMs);

    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("Polling aborted"));
    };

    signal?.addEventListener("abort", onAbort);
  });
}

export async function pollCompressionStatus(
  projectId: string,
  runId: string,
  token?: string,
  options: CompressionPollOptions = {},
): Promise<CompressionStatusResponse> {
  const {
    intervalMs = 2000,
    timeoutMs = 5 * 60 * 1000,
    signal,
    onUpdate,
  } = options;
  const startedAt = Date.now();

  while (true) {
    if (signal?.aborted) {
      throw new Error("Polling aborted");
    }

    const status = await getCompressionStatus(projectId, runId, token);
    onUpdate?.(status);

    if (status.status === "completed" || status.status === "failed") {
      return status;
    }

    if (timeoutMs > 0 && Date.now() - startedAt > timeoutMs) {
      throw new Error("Polling timeout");
    }

    await sleepWithAbort(intervalMs, signal);
  }
}

type TaskPollOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  onUpdate?: (status: TaskStatusResponse) => void;
};

export async function pollTaskStatus(
  taskId: string,
  token?: string,
  options: TaskPollOptions = {},
): Promise<TaskStatusResponse> {
  const {
    intervalMs = 2000,
    timeoutMs = 5 * 60 * 1000,
    signal,
    onUpdate,
  } = options;
  const startedAt = Date.now();

  while (true) {
    if (signal?.aborted) {
      throw new Error("Polling aborted");
    }

    const status = await getTaskStatus(taskId, token);
    onUpdate?.(status);

    if (status.status === "completed" || status.status === "failed") {
      return status;
    }

    if (timeoutMs > 0 && Date.now() - startedAt > timeoutMs) {
      throw new Error("Polling timeout");
    }

    await sleepWithAbort(intervalMs, signal);
  }
}
