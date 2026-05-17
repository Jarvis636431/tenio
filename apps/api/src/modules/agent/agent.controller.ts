import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type {
  AgentInitResponse,
  AgentOperationStatusResponse,
  AgentSessionListResponse,
  AgentSessionMessagesResponse,
  AgentTicketResponse,
  SendAgentMessageResponse,
} from "@tenio/shared";
import { CurrentUser } from "../../common/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import { CurrentAgentTicket } from "./current-agent-ticket.decorator.js";
import type { AuthenticatedAgentTicket } from "./agent.types.js";
import { AgentTicketGuard } from "./agent-ticket.guard.js";
import { AgentTicketService } from "./agent-ticket.service.js";
import { AgentStreamService } from "./agent-stream.service.js";
import { AgentService } from "./agent.service.js";
import { AgentInitDto } from "./dto/agent-init.dto.js";
import { IssueAgentTicketDto } from "./dto/issue-agent-ticket.dto.js";
import { ListAgentSessionsDto } from "./dto/list-agent-sessions.dto.js";
import { SendAgentMessageDto } from "./dto/send-agent-message.dto.js";

interface SseResponseLike {
  setHeader(name: string, value: string): void;
  flushHeaders(): void;
  write(chunk: string): void;
  end(): void;
}

@Controller()
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly agentTicketService: AgentTicketService,
    private readonly agentStreamService: AgentStreamService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("agent/tickets")
  issueAgentTicket(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Body() payload: IssueAgentTicketDto,
  ): Promise<AgentTicketResponse> {
    return this.agentTicketService.issueTicket(currentUser.id, payload.project_id);
  }

  @UseGuards(AgentTicketGuard)
  @Post("agent/init")
  initAgentSession(
    @CurrentAgentTicket() currentTicket: AuthenticatedAgentTicket,
    @Body() payload: AgentInitDto,
  ): Promise<AgentInitResponse> {
    return this.agentService.issueSession(currentTicket, payload);
  }

  @UseGuards(AgentTicketGuard)
  @Get("agent/sessions")
  listAgentSessions(
    @CurrentAgentTicket() currentTicket: AuthenticatedAgentTicket,
    @Query() query: ListAgentSessionsDto,
  ): Promise<AgentSessionListResponse> {
    return this.agentService.listSessions(currentTicket, query);
  }

  @UseGuards(AgentTicketGuard)
  @Get("agent/sessions/:sessionId/messages")
  getAgentSessionMessages(
    @CurrentAgentTicket() currentTicket: AuthenticatedAgentTicket,
    @Param("sessionId") sessionId: string,
  ): Promise<AgentSessionMessagesResponse> {
    return this.agentService.listSessionMessages(currentTicket, sessionId);
  }

  @UseGuards(AgentTicketGuard)
  @Post("agent/sessions/:sessionId/messages")
  sendAgentSessionMessage(
    @CurrentAgentTicket() currentTicket: AuthenticatedAgentTicket,
    @Param("sessionId") sessionId: string,
    @Body() payload: SendAgentMessageDto,
  ): Promise<SendAgentMessageResponse> {
    return this.agentService.sendSessionMessage(currentTicket, sessionId, payload);
  }

  @UseGuards(AgentTicketGuard)
  @Get("agent/streams/:streamId/sse")
  async subscribeAgentStream(
    @CurrentAgentTicket() _currentTicket: AuthenticatedAgentTicket,
    @Param("streamId") streamId: string,
    @Res() res: SseResponseLike,
  ): Promise<void> {
    const events = this.agentStreamService.getStream(streamId);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    for (const event of events) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
    this.agentStreamService.deleteStream(streamId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("projects/:projectId/operations/:operationId")
  getProjectOperationStatus(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Param("operationId") operationId: string,
  ): Promise<AgentOperationStatusResponse> {
    return this.agentService.getOperationStatus(currentUser, projectId, operationId);
  }
}
