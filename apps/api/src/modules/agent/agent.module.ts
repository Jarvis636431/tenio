import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { AgentController } from "./agent.controller.js";
import { AgentStreamService } from "./agent-stream.service.js";
import { AgentService } from "./agent.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [AgentController],
  providers: [AgentService, AgentStreamService],
})
export class AgentModule {}
