import type { AuthenticatedRequestUser } from "../../auth/auth.types.js";
import type {
  AgentIntent,
  AgentReadIntentType,
  AgentWriteIntentType,
} from "../intent/agent-intent.types.js";

export type AgentToolCapability = "read" | "write";

export interface AgentToolDescriptor {
  toolId: string;
  displayName: string;
  description: string;
  capability: AgentToolCapability;
  requiresApproval: boolean;
}

export interface AgentToolExecutionContext {
  currentUser: AuthenticatedRequestUser;
  projectId: string;
  intent: AgentIntent;
}

export interface AgentToolExecutionResult {
  summaryText: string;
  data?: unknown;
  artifactTypesToRefresh?: string[];
}

export interface AgentTool extends AgentToolDescriptor {
  intentType: AgentReadIntentType | AgentWriteIntentType;
  canHandle(intent: AgentIntent): boolean;
  execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult>;
}
