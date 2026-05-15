import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequestUser } from "../../modules/auth/auth.types.js";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedRequestUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedRequestUser }>();
    return request.user;
  },
);
