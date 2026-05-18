import { Injectable } from "@nestjs/common";
import { ArtifactsService } from "../../../artifacts/artifacts.service.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class GetLatestArtifactsTool implements AgentTool {
  readonly toolId = "get_latest_artifacts";
  readonly displayName = "获取最新产物";
  readonly description = "读取项目下各类最新产物的摘要。";
  readonly capability = "read" as const;
  readonly requiresApproval = false;

  constructor(private readonly artifactsService: ArtifactsService) {}

  matches(content: string): boolean {
    return /(产物|文档|网络图|graph|time[\s_-]?cost|crew[\s_-]?plan|最新结果)/i.test(content);
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const artifacts = await this.artifactsService.listArtifactSummaries(
      context.currentUser,
      context.projectId,
    );

    const latestByType = new Map<string, (typeof artifacts.items)[number]>();
    for (const artifact of artifacts.items) {
      if (!latestByType.has(artifact.artifact_type)) {
        latestByType.set(artifact.artifact_type, artifact);
      }
    }

    const lines = [...latestByType.values()].map(
      (artifact) =>
        `${artifact.artifact_type} v${artifact.artifact_version}（${artifact.artifact_status}）`,
    );

    return {
      summaryText:
        lines.length === 0 ? "当前项目还没有可读取的产物。" : ["最新产物如下：", ...lines].join("\n"),
      data: {
        artifacts: [...latestByType.values()],
      },
    };
  }
}
