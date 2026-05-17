import type {
  AgentMessageRole,
  AgentMessageType,
  AgentOperationStatus,
  AgentSessionStatus,
} from "@prisma/client";

export interface AgentTicketClaims {
  sub: string;
  project_id: string;
  scopes: string[];
  type: "agent_ticket";
}

export interface AuthenticatedAgentTicket {
  userId: string;
  projectId: string;
  scopes: string[];
}

export interface AgentStreamEnvelope {
  type: string;
  content_text?: string;
  message_type?: string;
  operation_id?: string;
  data?: unknown;
}

export const AGENT_TICKET_TYPE = "project_agent_access";
export const DEFAULT_AGENT_SCOPES = ["agent:chat", "agent:session:read", "project:read"] as const;

export function toSessionStatusValue(status: AgentSessionStatus): string {
  return status.toLowerCase();
}

export function toMessageRoleValue(role: AgentMessageRole): string {
  return role.toLowerCase();
}

export function toMessageTypeValue(type: AgentMessageType): string {
  return type.toLowerCase();
}

export function toOperationStatusValue(status: AgentOperationStatus): string {
  return status.toLowerCase();
}
