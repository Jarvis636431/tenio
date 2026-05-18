import { Injectable } from "@nestjs/common";
import { FilesService } from "../../../files/files.service.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class DeleteProjectFileTool implements AgentTool {
  readonly toolId = "delete_project_file";
  readonly displayName = "删除项目文件";
  readonly description = "删除当前项目中的指定文件。";
  readonly capability = "write" as const;
  readonly requiresApproval = true;

  constructor(private readonly filesService: FilesService) {}

  matches(content: string): boolean {
    return /(删除文件|删除项目文件|移除文件|删掉文件)/.test(content);
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const targetName = this.extractTargetFileName(context.content);
    if (!targetName) {
      throw new Error("未能从消息中提取要删除的文件名");
    }

    const files = await this.filesService.listProjectFiles(context.currentUser, context.projectId);
    const exactMatch =
      files.items.find((file) => file.original_file_name === targetName) ??
      files.items.find((file) => file.stored_file_name === targetName);

    const file =
      exactMatch ??
      this.resolveSingleFuzzyMatch(
        files.items.filter(
          (item) =>
            item.original_file_name.includes(targetName) || item.stored_file_name.includes(targetName),
        ),
        targetName,
      );

    if (!file) {
      throw new Error(`未找到文件“${targetName}”`);
    }

    await this.filesService.deleteProjectFile(context.currentUser, context.projectId, file.file_id);

    return {
      summaryText: `文件“${file.original_file_name}”已删除。`,
      data: {
        file_id: file.file_id,
        original_file_name: file.original_file_name,
      },
      artifactTypesToRefresh: ["upload_summary"],
    };
  }

  private extractTargetFileName(content: string): string | null {
    const normalized = content.trim();
    const quotedMatch = normalized.match(/[“"'「](.+?)[”"'」]/);
    if (quotedMatch?.[1]) {
      return quotedMatch[1].trim();
    }

    const match = normalized.match(/(?:删除文件|删除项目文件|移除文件|删掉文件)\s*(.+)$/);
    if (!match?.[1]) {
      return null;
    }

    return match[1].trim().replace(/[。！!]+$/u, "");
  }

  private resolveSingleFuzzyMatch<
    T extends { original_file_name: string; stored_file_name: string },
  >(matches: T[], targetName: string): T | null {
    if (matches.length === 1) {
      return matches[0];
    }

    if (matches.length > 1) {
      throw new Error(`匹配到多个文件“${targetName}”，请提供更完整的文件名`);
    }

    return null;
  }
}
