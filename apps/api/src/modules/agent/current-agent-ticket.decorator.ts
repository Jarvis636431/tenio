import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedAgentTicket } from "./agent.types.js";

export const CurrentAgentTicket = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedAgentTicket | undefined => {
    const request = ctx.switchToHttp().getRequest<{ agentTicket?: AuthenticatedAgentTicket }>();
    return request.agentTicket;
  },
);
