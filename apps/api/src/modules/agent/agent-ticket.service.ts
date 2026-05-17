import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import type { AgentTicketResponse } from "@tenio/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { getApiEnv } from "../../config/env.js";
import {
  AGENT_TICKET_TYPE,
  DEFAULT_AGENT_SCOPES,
  type AuthenticatedAgentTicket,
} from "./agent.types.js";

@Injectable()
export class AgentTicketService {
  private readonly env = getApiEnv();

  constructor(private readonly prisma: PrismaService) {}

  async issueTicket(userId: string, projectId: string): Promise<AgentTicketResponse> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const agentTicket = randomUUID();
    const refreshAfterSeconds = 300;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const scopes = [...DEFAULT_AGENT_SCOPES];

    await this.prisma.agentTicket.create({
      data: {
        userId,
        projectId,
        ticketHash: this.hashToken(agentTicket),
        ticketType: AGENT_TICKET_TYPE,
        grantType: AGENT_TICKET_TYPE,
        scopesJson: scopes,
        refreshAfterSeconds,
        expiresAt,
      },
    });

    return {
      agent_ticket: agentTicket,
      ticket_type: AGENT_TICKET_TYPE,
      expires_at: expiresAt.toISOString(),
      refresh_after_seconds: refreshAfterSeconds,
      scopes,
      agent_base_url: this.env.port ? `http://localhost:${this.env.port}` : "",
    };
  }

  async authenticate(rawToken: string): Promise<AuthenticatedAgentTicket> {
    const hash = this.hashToken(rawToken);
    const ticket = await this.prisma.agentTicket.findFirst({
      where: {
        ticketHash: hash,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!ticket) {
      throw new UnauthorizedException("Agent ticket 无效或已过期");
    }

    return {
      userId: ticket.userId,
      projectId: ticket.projectId,
      scopes: this.toScopes(ticket.scopesJson),
    };
  }

  private toScopes(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === "string");
  }

  private hashToken(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
}
