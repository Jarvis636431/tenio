import { Injectable } from "@nestjs/common";
import { ArtifactsService } from "../../../artifacts/artifacts.service.js";
import type { AgentIntent } from "../../intent/agent-intent.types.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class GetCrewPlanArtifactTool implements AgentTool {
  readonly toolId = "get_crew_plan_artifact";
  readonly intentType = "get_crew_plan_artifact" as const;
  readonly displayName = "获取班组计划";
  readonly description = "读取最新班组计划产物与班组分布摘要。";
  readonly capability = "read" as const;
  readonly requiresApproval = false;

  constructor(private readonly artifactsService: ArtifactsService) {}

  canHandle(intent: AgentIntent): boolean {
    return intent.intentType === this.intentType;
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const artifact = await this.artifactsService.getLatestCrewPlanArtifact(
      context.currentUser,
      context.projectId,
    );

    const crewPreview = artifact.crew_types
      .slice(0, 6)
      .map((group) => `${group.crew_type_name}：${group.crew_count} 个班组`)
      .join("\n");

    return {
      summaryText: [
        `班组类型：${artifact.summary.crew_type_count} 类`,
        `班组总数：${artifact.summary.crew_count}`,
        `任务数：${artifact.summary.crew_task_count}`,
        `计划区间：${artifact.summary.planned_start_date} 至 ${artifact.summary.planned_finish_date}`,
        crewPreview ? `班组分布：\n${crewPreview}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      data: {
        artifact,
      },
    };
  }
}
