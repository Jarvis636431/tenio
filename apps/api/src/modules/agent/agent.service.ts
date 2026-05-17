import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import {
  AgentMessageRole,
  AgentMessageType,
  AgentOperationStatus,
  AgentSessionStatus,
} from "@prisma/client";
import type {
  AgentInitResponse,
  AgentMessage,
  AgentOperationStatusResponse,
  AgentSession,
  AgentSessionListResponse,
  AgentSessionMessagesResponse,
  SendAgentMessageResponse,
} from "@tenio/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import type { AgentInitDto } from "./dto/agent-init.dto.js";
import type { ListAgentSessionsDto } from "./dto/list-agent-sessions.dto.js";
import type { SendAgentMessageDto } from "./dto/send-agent-message.dto.js";
import { AgentStreamService } from "./agent-stream.service.js";
import type { AuthenticatedAgentTicket } from "./agent.types.js";
import {
  toMessageRoleValue,
  toMessageTypeValue,
  toOperationStatusValue,
  toSessionStatusValue,
} from "./agent.types.js";

@Injectable()
export class AgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly streamService: AgentStreamService,
  ) {}

  async issueSession(
    currentUser: AuthenticatedAgentTicket,
    payload: AgentInitDto,
  ): Promise<AgentInitResponse> {
    if (currentUser.projectId !== payload.project_id) {
      throw new UnauthorizedException("Agent ticket 不匹配当前项目");
    }

    const existing = await this.prisma.agentSession.findFirst({
      where: {
        projectId: payload.project_id,
        userId: currentUser.userId,
        sessionStatus: AgentSessionStatus.ACTIVE,
      },
      orderBy: { updatedAt: "desc" },
    });

    const session =
      existing ??
      (await this.prisma.agentSession.create({
        data: {
          projectId: payload.project_id,
          userId: currentUser.userId,
          sessionTitle: "新会话",
          sessionStatus: AgentSessionStatus.ACTIVE,
        },
      }));

    return {
      current_session: this.toSession(session),
    };
  }

  async listSessions(
    currentUser: AuthenticatedAgentTicket,
    query: ListAgentSessionsDto,
  ): Promise<AgentSessionListResponse> {
    if (currentUser.projectId !== query.project_id) {
      throw new UnauthorizedException("Agent ticket 不匹配当前项目");
    }

    const items = await this.prisma.agentSession.findMany({
      where: {
        projectId: query.project_id,
        userId: currentUser.userId,
      },
      orderBy: { updatedAt: "desc" },
    });

    return {
      items: items.map((item) => this.toSession(item)),
      total: items.length,
      page: 1,
      page_size: items.length,
    };
  }

  async listSessionMessages(
    currentUser: AuthenticatedAgentTicket,
    sessionId: string,
  ): Promise<AgentSessionMessagesResponse> {
    const session = await this.findOwnedSession(currentUser, sessionId);
    const messages = await this.prisma.agentMessage.findMany({
      where: { sessionId },
      orderBy: { sentAt: "asc" },
    });

    return {
      chat_session_id: session.id,
      messages: messages.map((item) => this.toMessage(item)),
    };
  }

  async sendSessionMessage(
    currentUser: AuthenticatedAgentTicket,
    sessionId: string,
    payload: SendAgentMessageDto,
  ): Promise<SendAgentMessageResponse> {
    const session = await this.findOwnedSession(currentUser, sessionId);

    const userMessage = await this.prisma.agentMessage.create({
      data: {
        sessionId: session.id,
        projectId: session.projectId,
        userId: currentUser.userId,
        messageRole: AgentMessageRole.USER,
        messageType: AgentMessageType.TEXT,
        contentText: payload.content_text,
      },
    });

    let operationId: string | undefined;
    if (this.shouldCreateOperation(payload.content_text)) {
      const operation = await this.prisma.agentOperation.create({
        data: {
          projectId: session.projectId,
          sessionId: session.id,
          messageId: userMessage.id,
          createdByUserId: currentUser.userId,
          operationType: "project_update",
          operationStatus: AgentOperationStatus.COMPLETED,
          requiresApproval: false,
          inputPayloadJson: { content_text: payload.content_text },
          resultPayloadJson: { mode: "dry-run" },
        },
      });
      operationId = operation.id;
    }

    const assistantReply = this.buildAssistantReply(payload.content_text);
    const assistantMessage = await this.prisma.agentMessage.create({
      data: {
        sessionId: session.id,
        projectId: session.projectId,
        messageRole: AgentMessageRole.ASSISTANT,
        messageType: AgentMessageType.TEXT,
        contentText: assistantReply,
      },
    });

    await this.prisma.agentSession.update({
      where: { id: session.id },
      data: {
        lastMessageAt: assistantMessage.sentAt,
        sessionTitle: this.deriveSessionTitle(payload.content_text),
      },
    });

    const events = this.createStreamEvents(assistantReply, operationId);
    const streamId = this.streamService.createStream(events);

    return {
      ...this.toMessage(userMessage),
      stream_id: streamId,
    };
  }

  async getOperationStatus(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    operationId: string,
  ): Promise<AgentOperationStatusResponse> {
    const operation = await this.prisma.agentOperation.findFirst({
      where: {
        id: operationId,
        projectId,
        project: { ownerId: currentUser.id },
      },
    });

    if (!operation) {
      throw new NotFoundException(`Operation ${operationId} not found`);
    }

    return {
      operation_id: operation.id,
      project_id: operation.projectId,
      operation_status: toOperationStatusValue(operation.operationStatus),
      error_code: operation.errorCode,
      error_message: operation.errorMessage,
    };
  }

  private async findOwnedSession(
    currentUser: AuthenticatedAgentTicket,
    sessionId: string,
  ) {
    const session = await this.prisma.agentSession.findFirst({
      where: {
        id: sessionId,
        projectId: currentUser.projectId,
        userId: currentUser.userId,
      },
    });

    if (!session) {
      throw new NotFoundException(`Agent session ${sessionId} not found`);
    }

    return session;
  }

  private buildAssistantReply(userInput: string): string {
    return [
      "已收到你的消息。",
      `当前输入：${userInput}`,
      "这是第一版内置 agent 模块，当前先提供会话、消息、流式输出和操作骨架。",
    ].join("\n");
  }

  private deriveSessionTitle(content: string): string {
    const normalized = content.trim();
    return normalized.length <= 24 ? normalized : `${normalized.slice(0, 24)}...`;
  }

  private shouldCreateOperation(content: string): boolean {
    return /(调整|修改|更新|删除|压缩|变更)/.test(content);
  }

  private createStreamEvents(content: string, operationId?: string) {
    const events: Array<{
      type: string;
      content_text?: string;
      message_type?: string;
      operation_id?: string;
    }> = [];
    const segments = content
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    for (const segment of segments) {
      events.push({
        type: "update",
        content_text: segment,
        message_type: "text",
        ...(operationId ? { operation_id: operationId } : {}),
      });
    }

    if (operationId) {
      events.push({
        type: "refetch",
        operation_id: operationId,
      });
    }

    return events;
  }

  private toSession(session: {
    id: string;
    sessionTitle: string;
    sessionStatus: AgentSessionStatus;
    lastMessageAt: Date | null;
  }): AgentSession {
    return {
      chat_session_id: session.id,
      session_title: session.sessionTitle,
      session_status: toSessionStatusValue(session.sessionStatus),
      last_message_at: session.lastMessageAt?.toISOString() ?? null,
    };
  }

  private toMessage(message: {
    id: string;
    messageRole: AgentMessageRole;
    messageType: AgentMessageType;
    contentText: string;
    sentAt: Date;
  }): AgentMessage {
    return {
      message_id: message.id,
      message_role: toMessageRoleValue(message.messageRole),
      message_type: toMessageTypeValue(message.messageType),
      content_text: message.contentText,
      sent_at: message.sentAt.toISOString(),
    };
  }
}
