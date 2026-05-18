import { Injectable } from "@nestjs/common";
import { ProjectsService } from "../../../projects/projects.service.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class ActivateProjectTool implements AgentTool {
  readonly toolId = "activate_project";
  readonly displayName = "激活项目";
  readonly description = "将当前项目状态切换为 active。";
  readonly capability = "write" as const;
  readonly requiresApproval = true;

  constructor(private readonly projectsService: ProjectsService) {}

  matches(content: string): boolean {
    return /(激活项目|启用项目|恢复项目|设为进行中|设为活跃)/.test(content);
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const project = await this.projectsService.activate(context.currentUser, context.projectId);

    return {
      summaryText: `项目“${project.project_name}”已激活，当前状态为 ${project.project_status}。`,
      data: { project },
      artifactTypesToRefresh: ["project_context"],
    };
  }
}
