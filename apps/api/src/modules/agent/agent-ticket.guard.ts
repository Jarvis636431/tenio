import { CanActivate, Injectable, UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { AgentTicketService } from "./agent-ticket.service.js";
import type { AuthenticatedAgentTicket } from "./agent.types.js";

@Injectable()
export class AgentTicketGuard implements CanActivate {
  constructor(private readonly agentTicketService: AgentTicketService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined>; agentTicket?: AuthenticatedAgentTicket }>();

    const authHeader = request.headers.authorization;
    const rawToken = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (!rawToken?.startsWith("Bearer ")) {
      throw new UnauthorizedException("缺少 agent ticket");
    }

    request.agentTicket = await this.agentTicketService.authenticate(rawToken.slice("Bearer ".length));
    return true;
  }
}
