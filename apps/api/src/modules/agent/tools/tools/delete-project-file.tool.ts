import { Injectable } from "@nestjs/common";
import { FilesService } from "../../../files/files.service.js";
import type { AgentIntent } from "../../intent/agent-intent.types.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class DeleteProjectFileTool implements AgentTool {
  readonly toolId = "delete_project_file";
  readonly intentType = "delete_project_file" as const;
  readonly displayName = "删除项目文件";
  readonly description = "删除当前项目中的指定文件。";
  readonly capability = "write" as const;
  readonly requiresApproval = true;

  constructor(private readonly filesService: FilesService) {}

  canHandle(intent: AgentIntent): boolean {
    return intent.intentType === this.intentType;
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const targetName =
      context.intent.intentType === this.intentType ? context.intent.fileName : null;
    if (!targetName) {
      throw new Error("当前 intent 缺少要删除的文件名");
    }

    const files = await this.filesService.listProjectFiles(context.currentUser, context.projectId);
    const exactMatch = files.items.find((file) => file.original_name === targetName);

    const file =
      exactMatch ??
      this.resolveSingleFuzzyMatch(
        files.items.filter((item) => item.original_name.includes(targetName)),
        targetName,
      );

    if (!file) {
      throw new Error(`未找到文件“${targetName}”`);
    }

    await this.filesService.deleteProjectFile(context.currentUser, context.projectId, file.id);

    return {
      summaryText: `文件“${file.original_name}”已删除。`,
      data: {
        id: file.id,
        original_name: file.original_name,
      },
      artifactTypesToRefresh: ["upload_summary"],
    };
  }

  private resolveSingleFuzzyMatch<T extends { original_name: string }>(
    matches: T[],
    targetName: string,
  ): T | null {
    if (matches.length === 1) {
      return matches[0];
    }

    if (matches.length > 1) {
      throw new Error(`匹配到多个文件“${targetName}”，请提供更完整的文件名`);
    }

    return null;
  }
}
