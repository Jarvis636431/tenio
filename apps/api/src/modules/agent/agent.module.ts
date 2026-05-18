import { Module } from "@nestjs/common";
import { ArtifactsModule } from "../artifacts/artifacts.module.js";
import { FilesModule } from "../files/files.module.js";
import { ProjectsModule } from "../projects/projects.module.js";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { AgentOperationExecutor } from "./agent-operation.executor.js";
import { AgentController } from "./agent.controller.js";
import { AgentStreamService } from "./agent-stream.service.js";
import { AgentService } from "./agent.service.js";
import { AgentToolRegistry } from "./tools/agent-tool.registry.js";
import { ArchiveProjectTool } from "./tools/tools/archive-project.tool.js";
import { GetLatestArtifactsTool } from "./tools/tools/get-latest-artifacts.tool.js";
import { GetProjectContextTool } from "./tools/tools/get-project-context.tool.js";
import { ListProjectFilesTool } from "./tools/tools/list-project-files.tool.js";

@Module({
  imports: [PrismaModule, ProjectsModule, FilesModule, ArtifactsModule],
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentStreamService,
    AgentOperationExecutor,
    AgentToolRegistry,
    GetProjectContextTool,
    ListProjectFilesTool,
    GetLatestArtifactsTool,
    ArchiveProjectTool,
  ],
})
export class AgentModule {}
