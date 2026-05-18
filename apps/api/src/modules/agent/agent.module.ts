import { Module } from "@nestjs/common";
import { ArtifactsModule } from "../artifacts/artifacts.module.js";
import { FilesModule } from "../files/files.module.js";
import { ProjectsModule } from "../projects/projects.module.js";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { AgentOperationExecutor } from "./agent-operation.executor.js";
import { AgentController } from "./agent.controller.js";
import { AgentIntentResolver } from "./intent/agent-intent.resolver.js";
import { AgentStreamService } from "./agent-stream.service.js";
import { AgentService } from "./agent.service.js";
import { ActivateProjectTool } from "./tools/tools/activate-project.tool.js";
import { AgentToolRegistry } from "./tools/agent-tool.registry.js";
import { ArchiveProjectTool } from "./tools/tools/archive-project.tool.js";
import { DeleteProjectFileTool } from "./tools/tools/delete-project-file.tool.js";
import { GetCrewPlanArtifactTool } from "./tools/tools/get-crew-plan-artifact.tool.js";
import { GetDocumentArtifactTool } from "./tools/tools/get-document-artifact.tool.js";
import { GetGraphArtifactTool } from "./tools/tools/get-graph-artifact.tool.js";
import { GetLatestArtifactsTool } from "./tools/tools/get-latest-artifacts.tool.js";
import { GetProjectContextTool } from "./tools/tools/get-project-context.tool.js";
import { GetTimeCostArtifactTool } from "./tools/tools/get-time-cost-artifact.tool.js";
import { ListProjectFilesTool } from "./tools/tools/list-project-files.tool.js";
import { UpdateProjectNameTool } from "./tools/tools/update-project-name.tool.js";

@Module({
  imports: [PrismaModule, ProjectsModule, FilesModule, ArtifactsModule],
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentStreamService,
    AgentOperationExecutor,
    AgentIntentResolver,
    AgentToolRegistry,
    GetProjectContextTool,
    ListProjectFilesTool,
    GetDocumentArtifactTool,
    GetGraphArtifactTool,
    GetTimeCostArtifactTool,
    GetCrewPlanArtifactTool,
    GetLatestArtifactsTool,
    UpdateProjectNameTool,
    ActivateProjectTool,
    DeleteProjectFileTool,
    ArchiveProjectTool,
  ],
})
export class AgentModule {}
