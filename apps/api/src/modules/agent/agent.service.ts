import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AgentMessageRole,
  AgentMessageType,
  AgentOperationStatus,
  AgentSessionStatus,
} from "@prisma/client";
import type {
  AgentMessage,
  AgentOperationStatusResponse,
  AgentSession,
  AgentSessionListResponse,
  AgentSessionMessagesResponse,
  CreateAgentSessionResponse,
  SendAgentMessageResponse,
} from "@tenio/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import type { CreateAgentSessionDto } from "./dto/create-agent-session.dto.js";
import type { ListAgentSessionsDto } from "./dto/list-agent-sessions.dto.js";
import type { SendAgentMessageDto } from "./dto/send-agent-message.dto.js";
import { AgentStreamService } from "./agent-stream.service.js";
import {
  toMessageRoleValue,
  toMessageTypeValue,
  toOperationStatusValue,
  toSessionStatusValue,
  type AgentStreamEnvelope,
} from "./agent.types.js";

type OwnedSession = {
  id: string;
  projectId: string;
  userId: string;
  sessionTitle: string;
  sessionStatus: AgentSessionStatus;
  lastMessageAt: Date | null;
};

@Injectable()
export class AgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly streamService: AgentStreamService,
  ) {}

  async assertProjectAccess(currentUser: AuthenticatedRequestUser, projectId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: currentUser.id,
      },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  async createSession(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    payload: CreateAgentSessionDto,
  ): Promise<CreateAgentSessionResponse> {
    await this.assertProjectAccess(currentUser, projectId);

    const session = await this.prisma.agentSession.create({
      data: {
        projectId,
        userId: currentUser.id,
        sessionTitle: payload.session_title?.trim() || "新会话",
        sessionStatus: AgentSessionStatus.ACTIVE,
      },
    });

    return {
      current_session: this.toSession(session),
    };
  }

  async listSessions(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    query: ListAgentSessionsDto,
  ): Promise<AgentSessionListResponse> {
    await this.assertProjectAccess(currentUser, projectId);

    const sessionStatus = query.session_status?.trim().toUpperCase();
    const items = await this.prisma.agentSession.findMany({
      where: {
        projectId,
        userId: currentUser.id,
        ...(sessionStatus === "ACTIVE" || sessionStatus === "ARCHIVED"
          ? { sessionStatus: sessionStatus as AgentSessionStatus }
          : {}),
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
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    sessionId: string,
  ): Promise<AgentSessionMessagesResponse> {
    const session = await this.findOwnedSession(currentUser, projectId, sessionId);
    const messages = await this.prisma.agentMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { sentAt: "asc" },
    });

    return {
      chat_session_id: session.id,
      messages: messages.map((item) => this.toMessage(item)),
    };
  }

  async sendSessionMessage(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    sessionId: string,
    payload: SendAgentMessageDto,
  ): Promise<SendAgentMessageResponse> {
    const session = await this.findOwnedSession(currentUser, projectId, sessionId);
    const normalizedContent = payload.content_text.trim();

    const userMessage = await this.prisma.agentMessage.create({
      data: {
        sessionId: session.id,
        projectId: session.projectId,
        userId: currentUser.id,
        messageRole: AgentMessageRole.USER,
        messageType: AgentMessageType.TEXT,
        contentText: normalizedContent,
      },
    });

    const operationDecision = await this.resolveOperationIntent(
      currentUser,
      session,
      userMessage.id,
      normalizedContent,
    );

    const assistantReply = this.buildAssistantReply(normalizedContent, operationDecision.kind);
    const assistantMessage = await this.prisma.agentMessage.create({
      data: {
        sessionId: session.id,
        projectId: session.projectId,
        messageRole: AgentMessageRole.ASSISTANT,
        messageType:
          operationDecision.kind === "approval_required"
            ? AgentMessageType.INTERRUPT
            : AgentMessageType.TEXT,
        contentText: assistantReply,
      },
    });

    await this.prisma.agentSession.update({
      where: { id: session.id },
      data: {
        lastMessageAt: assistantMessage.sentAt,
        sessionTitle: session.lastMessageAt ? session.sessionTitle : this.deriveSessionTitle(normalizedContent),
      },
    });

    const events = this.createStreamEvents(assistantReply, operationDecision);
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
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    sessionId: string,
  ): Promise<OwnedSession> {
    const session = await this.prisma.agentSession.findFirst({
      where: {
        id: sessionId,
        projectId,
        userId: currentUser.id,
      },
    });

    if (!session) {
      throw new NotFoundException(`Agent session ${sessionId} not found`);
    }

    return session;
  }

  private async resolveOperationIntent(
    currentUser: AuthenticatedRequestUser,
    session: OwnedSession,
    messageId: string,
    content: string,
  ): Promise<
    | { kind: "none" }
    | { kind: "approval_required"; operationId: string }
    | { kind: "approved"; operationId: string }
    | { kind: "rejected"; operationId: string }
  > {
    const pendingOperation = await this.prisma.agentOperation.findFirst({
      where: {
        sessionId: session.id,
        operationStatus: AgentOperationStatus.WAITING_APPROVAL,
      },
      orderBy: { createdAt: "desc" },
    });

    if (pendingOperation && this.isApprovalMessage(content)) {
      await this.prisma.agentOperation.update({
        where: { id: pendingOperation.id },
        data: {
          operationStatus: AgentOperationStatus.COMPLETED,
          requiresApproval: false,
          resultPayloadJson: { approved: true, content_text: content },
          errorCode: null,
          errorMessage: null,
        },
      });

      return {
        kind: "approved",
        operationId: pendingOperation.id,
      };
    }

    if (pendingOperation && this.isRejectMessage(content)) {
      await this.prisma.agentOperation.update({
        where: { id: pendingOperation.id },
        data: {
          operationStatus: AgentOperationStatus.CANCELED,
          requiresApproval: false,
          resultPayloadJson: { approved: false, content_text: content },
          errorCode: "USER_REJECTED",
          errorMessage: "用户拒绝执行该操作",
        },
      });

      return {
        kind: "rejected",
        operationId: pendingOperation.id,
      };
    }

    if (!this.shouldCreateOperation(content)) {
      return { kind: "none" };
    }

    const operation = await this.prisma.agentOperation.create({
      data: {
        projectId: session.projectId,
        sessionId: session.id,
        messageId,
        createdByUserId: currentUser.id,
        operationType: "project_update",
        operationStatus: AgentOperationStatus.WAITING_APPROVAL,
        requiresApproval: true,
        inputPayloadJson: { content_text: content },
      },
    });

    return {
      kind: "approval_required",
      operationId: operation.id,
    };
  }

  private buildAssistantReply(
    userInput: string,
    kind: "none" | "approval_required" | "approved" | "rejected",
  ): string {
    if (kind === "approval_required") {
      return [
        "我已经识别到这是一条会影响项目数据的操作请求。",
        `拟执行内容：${userInput}`,
        "请明确回复“同意”或“拒绝”。",
      ].join("\n");
    }

    if (kind === "approved") {
      return [
        "已收到你的确认。",
        "当前版本先把该操作标记为已确认完成，并触发相关产物刷新。",
      ].join("\n");
    }

    if (kind === "rejected") {
      return "已取消这次操作，不会对项目数据做变更。";
    }

    return [
      "已收到你的消息。",
      `当前输入：${userInput}`,
      "这是重构后的内置 agent 第一版，当前先收口会话、消息、流和操作边界。",
    ].join("\n");
  }

  private deriveSessionTitle(content: string): string {
    const normalized = content.trim();
    return normalized.length <= 24 ? normalized : `${normalized.slice(0, 24)}...`;
  }

  private shouldCreateOperation(content: string): boolean {
    return /(调整|修改|更新|删除|压缩|变更)/.test(content);
  }

  private isApprovalMessage(content: string): boolean {
    return /^(同意|确认|继续|是|可以|执行)/.test(content.trim());
  }

  private isRejectMessage(content: string): boolean {
    return /^(拒绝|取消|否|不用了|停止)/.test(content.trim());
  }

  private createStreamEvents(
    content: string,
    decision:
      | { kind: "none" }
      | { kind: "approval_required"; operationId: string }
      | { kind: "approved"; operationId: string }
      | { kind: "rejected"; operationId: string },
  ): AgentStreamEnvelope[] {
    const events: AgentStreamEnvelope[] = [];
    const segments = content
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    for (const segment of segments) {
      events.push({
        type: "message.delta",
        content_text: segment,
        message_type: "text",
      });
    }

    if (decision.kind === "approval_required") {
      events.push({
        type: "operation.requires_approval",
        operation_id: decision.operationId,
        message_type: "interrupt",
      });
    }

    if (decision.kind === "approved") {
      events.push({
        type: "operation.completed",
        operation_id: decision.operationId,
      });
      events.push({
        type: "artifact.refresh_required",
        operation_id: decision.operationId,
        artifact_types: ["document", "graph", "time_cost", "crew_plan"],
      });
    }

    if (decision.kind === "rejected") {
      events.push({
        type: "operation.canceled",
        operation_id: decision.operationId,
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
