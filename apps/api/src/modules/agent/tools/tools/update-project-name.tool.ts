import { Injectable } from "@nestjs/common";
import { ProjectsService } from "../../../projects/projects.service.js";
import type { AgentIntent } from "../../intent/agent-intent.types.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class UpdateProjectNameTool implements AgentTool {
  readonly toolId = "update_project_name";
  readonly intentType = "update_project_name" as const;
  readonly displayName = "修改项目名称";
  readonly description = "将当前项目重命名为新的名称。";
  readonly capability = "write" as const;
  readonly requiresApproval = true;

  constructor(private readonly projectsService: ProjectsService) {}

  canHandle(intent: AgentIntent): boolean {
    return intent.intentType === this.intentType;
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const projectName = context.intent.intentType === this.intentType ? context.intent.projectName : null;
    if (!projectName) {
      throw new Error("当前 intent 缺少目标项目名称");
    }

    const project = await this.projectsService.rename(
      context.currentUser,
      context.projectId,
      projectName,
    );

    return {
      summaryText: `项目名称已更新为“${project.name}”。`,
      data: { project },
      artifactTypesToRefresh: ["project_context"],
    };
  }
}
