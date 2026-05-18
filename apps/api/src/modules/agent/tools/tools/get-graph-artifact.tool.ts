import { Injectable } from "@nestjs/common";
import { ArtifactsService } from "../../../artifacts/artifacts.service.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class GetGraphArtifactTool implements AgentTool {
  readonly toolId = "get_graph_artifact";
  readonly displayName = "获取网络图";
  readonly description = "读取最新网络图产物及关键任务摘要。";
  readonly capability = "read" as const;
  readonly requiresApproval = false;

  constructor(private readonly artifactsService: ArtifactsService) {}

  matches(content: string): boolean {
    return /(网络图|关键路径|graph|计划图)/i.test(content);
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const artifact = await this.artifactsService.getLatestGraphArtifact(
      context.currentUser,
      context.projectId,
    );

    const criticalTasks = artifact.graph
      .filter((task) => task.isCriticalPath)
      .slice(0, 6)
      .map((task) => `${task.seqNo}. ${task.taskName}（${task.durationDays} 天）`)
      .join("\n");

    return {
      summaryText: [
        `网络图任务数：${artifact.summary?.task_count ?? artifact.graph.length}`,
        `关键任务数：${artifact.summary?.critical_task_count ?? 0}`,
        artifact.summary?.planned_start_date && artifact.summary?.planned_finish_date
          ? `计划工期：${artifact.summary.planned_start_date} 至 ${artifact.summary.planned_finish_date}`
          : null,
        criticalTasks ? `关键路径预览：\n${criticalTasks}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      data: {
        artifact,
      },
    };
  }
}
