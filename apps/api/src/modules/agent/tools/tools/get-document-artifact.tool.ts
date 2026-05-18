import { Injectable } from "@nestjs/common";
import { ArtifactsService } from "../../../artifacts/artifacts.service.js";
import type { AgentIntent } from "../../intent/agent-intent.types.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class GetDocumentArtifactTool implements AgentTool {
  readonly toolId = "get_document_artifact";
  readonly intentType = "get_document_artifact" as const;
  readonly displayName = "获取施工文档";
  readonly description = "读取最新文档产物的标题、目录和正文摘要。";
  readonly capability = "read" as const;
  readonly requiresApproval = false;

  constructor(private readonly artifactsService: ArtifactsService) {}

  canHandle(intent: AgentIntent): boolean {
    return intent.intentType === this.intentType;
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const artifact = await this.artifactsService.getLatestDocumentArtifact(
      context.currentUser,
      context.projectId,
    );

    const tocPreview = (artifact.toc_items ?? [])
      .slice(0, 8)
      .map((item) => `${item.order_no}. ${item.title}`)
      .join("\n");
    const contentPreview = artifact.content_markdown
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 6)
      .join("\n");

    return {
      summaryText: [
        `文档标题：${artifact.document_title}`,
        `章节数：${artifact.chapter_count}，字数：${artifact.word_count}`,
        tocPreview ? `目录预览：\n${tocPreview}` : null,
        contentPreview ? `内容摘要：\n${contentPreview}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      data: {
        artifact,
      },
    };
  }
}
