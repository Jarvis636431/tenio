import type { AuthenticatedRequestUser } from "../../auth/auth.types.js";

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
  content: string;
}

export interface AgentToolExecutionResult {
  summaryText: string;
  data?: unknown;
  artifactTypesToRefresh?: string[];
}

export interface AgentTool extends AgentToolDescriptor {
  matches(content: string): boolean;
  execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult>;
}
