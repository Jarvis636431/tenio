import { Injectable } from "@nestjs/common";
import { FilesService } from "../../../files/files.service.js";
import type { AgentIntent } from "../../intent/agent-intent.types.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class ListProjectFilesTool implements AgentTool {
  readonly toolId = "list_project_files";
  readonly intentType = "list_project_files" as const;
  readonly displayName = "列出项目文件";
  readonly description = "读取项目下的文件列表、分类和状态。";
  readonly capability = "read" as const;
  readonly requiresApproval = false;

  constructor(private readonly filesService: FilesService) {}

  canHandle(intent: AgentIntent): boolean {
    return intent.intentType === this.intentType;
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const files = await this.filesService.listProjectFiles(context.currentUser, context.projectId);
    const preview = files.items
      .slice(0, 8)
      .map((file) => `${file.original_file_name}（${file.category} / ${file.status}）`)
      .join("\n");

    return {
      summaryText:
        files.total === 0
          ? "当前项目还没有上传文件。"
          : [`当前项目共有 ${files.total} 个文件。`, preview].filter(Boolean).join("\n"),
      data: {
        files: files.items,
        total: files.total,
      },
    };
  }
}
