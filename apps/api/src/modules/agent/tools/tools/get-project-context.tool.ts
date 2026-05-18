import { Injectable } from "@nestjs/common";
import { ArtifactsService } from "../../../artifacts/artifacts.service.js";
import { FilesService } from "../../../files/files.service.js";
import { ProjectsService } from "../../../projects/projects.service.js";
import type { AgentIntent } from "../../intent/agent-intent.types.js";
import type {
  AgentTool,
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../agent-tool.types.js";

@Injectable()
export class GetProjectContextTool implements AgentTool {
  readonly toolId = "get_project_context";
  readonly intentType = "get_project_context" as const;
  readonly displayName = "获取项目概况";
  readonly description = "读取项目基础信息、文件统计与最新产物摘要。";
  readonly capability = "read" as const;
  readonly requiresApproval = false;

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly filesService: FilesService,
    private readonly artifactsService: ArtifactsService,
  ) {}

  canHandle(intent: AgentIntent): boolean {
    return intent.intentType === this.intentType;
  }

  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    const [project, fileStats, artifacts] = await Promise.all([
      this.projectsService.findOne(context.currentUser, context.projectId),
      this.filesService.getProjectFileStats(context.currentUser, context.projectId),
      this.artifactsService.listArtifactSummaries(context.currentUser, context.projectId),
    ]);

    const latestByType = new Map<string, string>();
    for (const artifact of artifacts.items) {
      if (!latestByType.has(artifact.artifact_type)) {
        latestByType.set(artifact.artifact_type, artifact.artifact_status);
      }
    }

    const artifactSummary = [...latestByType.entries()]
      .map(([type, status]) => `${type}: ${status}`)
      .join("；");

    return {
      summaryText: [
        `项目：${project.project_name}`,
        `状态：${project.project_status}`,
        `文件：共 ${fileStats.total_files} 个，已上传 ${fileStats.uploaded_files} 个，已就绪 ${fileStats.ready_files} 个`,
        artifactSummary ? `最新产物：${artifactSummary}` : "最新产物：暂无",
      ].join("\n"),
      data: {
        project,
        file_stats: fileStats,
        latest_artifacts: artifacts.items,
      },
    };
  }
}
