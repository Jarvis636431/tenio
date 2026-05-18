import { Injectable } from "@nestjs/common";
import { ProjectsService } from "../../../projects/projects.service.js";
import type { AgentIntent } from "../../intent/agent-intent.types.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class ArchiveProjectTool implements AgentTool {
  readonly toolId = "archive_project";
  readonly intentType = "archive_project" as const;
  readonly displayName = "归档项目";
  readonly description = "将当前项目归档。";
  readonly capability = "write" as const;
  readonly requiresApproval = true;

  constructor(private readonly projectsService: ProjectsService) {}

  canHandle(intent: AgentIntent): boolean {
    return intent.intentType === this.intentType;
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const project = await this.projectsService.archive(context.currentUser, context.projectId);

    return {
      summaryText: `项目“${project.project_name}”已归档。`,
      data: {
        project,
      },
    };
  }
}
