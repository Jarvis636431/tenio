import { Injectable } from "@nestjs/common";
import type { AgentTool, AgentToolDescriptor } from "./agent-tool.types.js";
import { ArchiveProjectTool } from "./tools/archive-project.tool.js";
import { GetLatestArtifactsTool } from "./tools/get-latest-artifacts.tool.js";
import { GetProjectContextTool } from "./tools/get-project-context.tool.js";
import { ListProjectFilesTool } from "./tools/list-project-files.tool.js";

@Injectable()
export class AgentToolRegistry {
  private readonly tools: AgentTool[];

  constructor(
    getProjectContextTool: GetProjectContextTool,
    listProjectFilesTool: ListProjectFilesTool,
    getLatestArtifactsTool: GetLatestArtifactsTool,
    archiveProjectTool: ArchiveProjectTool,
  ) {
    this.tools = [
      getProjectContextTool,
      listProjectFilesTool,
      getLatestArtifactsTool,
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
