import { Injectable } from "@nestjs/common";
import { ProjectsService } from "../../../projects/projects.service.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class UpdateProjectNameTool implements AgentTool {
  readonly toolId = "update_project_name";
  readonly displayName = "修改项目名称";
  readonly description = "将当前项目重命名为新的名称。";
  readonly capability = "write" as const;
  readonly requiresApproval = true;

  constructor(private readonly projectsService: ProjectsService) {}

  matches(content: string): boolean {
    return /(项目名称|项目名|项目).*(改成|改为|改名为|重命名为|命名为)/.test(content);
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const projectName = this.extractProjectName(context.content);
    if (!projectName) {
      throw new Error("未能从消息中提取目标项目名称");
    }

    const project = await this.projectsService.rename(
      context.currentUser,
      context.projectId,
      projectName,
    );

    return {
      summaryText: `项目名称已更新为“${project.project_name}”。`,
      data: { project },
      artifactTypesToRefresh: ["project_context"],
    };
  }

  private extractProjectName(content: string): string | null {
    const normalized = content.trim();
    const quotedMatch = normalized.match(/[“"'「](.+?)[”"'」]\s*$/);
    if (quotedMatch?.[1]) {
      return quotedMatch[1].trim();
    }

    const match = normalized.match(/(?:改成|改为|改名为|重命名为|命名为)\s*(.+)$/);
    if (!match?.[1]) {
      return null;
    }

    return match[1].trim().replace(/[。！!]+$/u, "");
  }
}
