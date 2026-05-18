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
  AgentOperationStatusResponse,
  AgentSessionMessagesResponse,
  AgentSessionListResponse,
  CreateAgentSessionResponse,
  SendAgentMessageResponse,
} from "@tenio/shared";
import { CurrentUser } from "../../common/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import { AgentStreamService } from "./agent-stream.service.js";
import { AgentService } from "./agent.service.js";
import { CreateAgentSessionDto } from "./dto/create-agent-session.dto.js";
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
    private readonly agentStreamService: AgentStreamService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("projects/:projectId/agent/sessions")
  createAgentSession(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Body() payload: CreateAgentSessionDto,
  ): Promise<CreateAgentSessionResponse> {
    return this.agentService.createSession(currentUser, projectId, payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get("projects/:projectId/agent/sessions")
  listAgentSessions(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Query() query: ListAgentSessionsDto,
  ): Promise<AgentSessionListResponse> {
    return this.agentService.listSessions(currentUser, projectId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get("projects/:projectId/agent/sessions/:sessionId/messages")
  getAgentSessionMessages(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Param("sessionId") sessionId: string,
  ): Promise<AgentSessionMessagesResponse> {
    return this.agentService.listSessionMessages(currentUser, projectId, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("projects/:projectId/agent/sessions/:sessionId/messages")
  sendAgentSessionMessage(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Param("sessionId") sessionId: string,
    @Body() payload: SendAgentMessageDto,
  ): Promise<SendAgentMessageResponse> {
    return this.agentService.sendSessionMessage(currentUser, projectId, sessionId, payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get("projects/:projectId/agent/streams/:streamId/sse")
  async subscribeAgentStream(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Param("streamId") streamId: string,
    @Res() res: SseResponseLike,
  ): Promise<void> {
    await this.agentService.assertProjectAccess(currentUser, projectId);
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
