import { Module } from "@nestjs/common";
import { AgentController } from "./agent.controller.js";
import { AgentTicketGuard } from "./agent-ticket.guard.js";
import { AgentTicketService } from "./agent-ticket.service.js";
import { AgentStreamService } from "./agent-stream.service.js";
import { AgentService } from "./agent.service.js";

@Module({
  controllers: [AgentController],
  providers: [AgentService, AgentTicketService, AgentStreamService, AgentTicketGuard],
})
export class AgentModule {}
