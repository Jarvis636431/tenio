import { Injectable } from "@nestjs/common";
import type { AgentTool, AgentToolDescriptor } from "./agent-tool.types.js";
import { ActivateProjectTool } from "./tools/activate-project.tool.js";
import { ArchiveProjectTool } from "./tools/archive-project.tool.js";
import { DeleteProjectFileTool } from "./tools/delete-project-file.tool.js";
import { GetCrewPlanArtifactTool } from "./tools/get-crew-plan-artifact.tool.js";
import { GetDocumentArtifactTool } from "./tools/get-document-artifact.tool.js";
import { GetGraphArtifactTool } from "./tools/get-graph-artifact.tool.js";
import { GetLatestArtifactsTool } from "./tools/get-latest-artifacts.tool.js";
import { GetProjectContextTool } from "./tools/get-project-context.tool.js";
import { GetTimeCostArtifactTool } from "./tools/get-time-cost-artifact.tool.js";
import { ListProjectFilesTool } from "./tools/list-project-files.tool.js";
import { UpdateProjectNameTool } from "./tools/update-project-name.tool.js";

@Injectable()
export class AgentToolRegistry {
  private readonly tools: AgentTool[];

  constructor(
    getProjectContextTool: GetProjectContextTool,
    listProjectFilesTool: ListProjectFilesTool,
    getDocumentArtifactTool: GetDocumentArtifactTool,
    getGraphArtifactTool: GetGraphArtifactTool,
    getTimeCostArtifactTool: GetTimeCostArtifactTool,
    getCrewPlanArtifactTool: GetCrewPlanArtifactTool,
    getLatestArtifactsTool: GetLatestArtifactsTool,
    updateProjectNameTool: UpdateProjectNameTool,
    activateProjectTool: ActivateProjectTool,
    deleteProjectFileTool: DeleteProjectFileTool,
    archiveProjectTool: ArchiveProjectTool,
  ) {
    this.tools = [
      getProjectContextTool,
      listProjectFilesTool,
      getDocumentArtifactTool,
      getGraphArtifactTool,
      getTimeCostArtifactTool,
      getCrewPlanArtifactTool,
      getLatestArtifactsTool,
      updateProjectNameTool,
      activateProjectTool,
      deleteProjectFileTool,
      archiveProjectTool,
    ];
  }

  listTools(): AgentToolDescriptor[] {
    return this.tools.map((tool) => ({
      toolId: tool.toolId,
      displayName: tool.displayName,
      description: tool.description,
      capability: tool.capability,
      requiresApproval: tool.requiresApproval,
    }));
  }

  resolveReadTool(content: string): AgentTool | null {
    return this.tools.find((tool) => tool.capability === "read" && tool.matches(content)) ?? null;
  }

  resolveWriteTool(content: string): AgentTool | null {
    return this.tools.find((tool) => tool.capability === "write" && tool.matches(content)) ?? null;
  }
}
