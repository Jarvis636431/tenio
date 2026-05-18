import type {
  AgentMessageRole,
  AgentMessageType,
  AgentOperationStatus,
  AgentSessionStatus,
} from "@prisma/client";

export interface AgentStreamEnvelope {
  type: string;
  content_text?: string;
  message_type?: string;
  operation_id?: string;
  artifact_types?: string[];
  data?: unknown;
}

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
