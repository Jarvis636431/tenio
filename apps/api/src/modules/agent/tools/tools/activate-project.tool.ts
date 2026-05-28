import { Injectable } from "@nestjs/common";
import { ProjectsService } from "../../../projects/projects.service.js";
import type { AgentIntent } from "../../intent/agent-intent.types.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class ActivateProjectTool implements AgentTool {
  readonly toolId = "activate_project";
  readonly intentType = "activate_project" as const;
  readonly displayName = "激活项目";
  readonly description = "将当前项目状态切换为 active。";
  readonly capability = "write" as const;
  readonly requiresApproval = true;

  constructor(private readonly projectsService: ProjectsService) {}

  canHandle(intent: AgentIntent): boolean {
    return intent.intentType === this.intentType;
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const project = await this.projectsService.activate(context.currentUser, context.projectId);

    return {
      summaryText: `项目“${project.name}”已激活，当前状态为 ${project.status}。`,
      data: { project },
      artifactTypesToRefresh: ["project_context"],
    };
  }
}
