import { Injectable } from "@nestjs/common";
import { ArtifactsService } from "../../../artifacts/artifacts.service.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class GetTimeCostArtifactTool implements AgentTool {
  readonly toolId = "get_time_cost_artifact";
  readonly displayName = "获取时长成本分析";
  readonly description = "读取最新时长成本产物与推荐方案摘要。";
  readonly capability = "read" as const;
  readonly requiresApproval = false;

  constructor(private readonly artifactsService: ArtifactsService) {}

  matches(content: string): boolean {
    return /(时长成本|工期成本|time[\s_-]?cost|成本分析|推荐工期)/i.test(content);
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const artifact = await this.artifactsService.getLatestTimeCostArtifact(
      context.currentUser,
      context.projectId,
    );

    return {
      summaryText: [
        `合同工期：${artifact.contract_duration_days} 天`,
        `最优工期：${artifact.optimal_duration_days} 天`,
        `最低总成本：${artifact.minimum_total_cost_cents} 分`,
        artifact.saving_rate_percent != null
          ? `节约比例：${artifact.saving_rate_percent}%`
          : null,
        `推荐说明：${artifact.recommendation.recommendation_text}`,
      ]
        .filter(Boolean)
        .join("\n"),
      data: {
        artifact,
      },
    };
  }
}
