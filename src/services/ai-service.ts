import { API_BASE } from "@/config";
import { requestJson } from "@/services/http";
import type {
  AgentInitPayload,
  AgentInitResponse,
  AgentResumePayload,
  AgentResumeResponse,
} from "@/types/domain/ai";

export async function initAgent(
  payload: AgentInitPayload,
): Promise<AgentInitResponse> {
  return requestJson<AgentInitResponse>(`${API_BASE.aiService}/api/agent/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function resumeAgent(
  payload: AgentResumePayload,
): Promise<AgentResumeResponse> {
  return requestJson<AgentResumeResponse>(
    `${API_BASE.aiService}/api/agent/chat/resume`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}
