import { CanActivate, Injectable, UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AuthTokenService } from "../../modules/auth/auth-token.service.js";
import type { AuthenticatedRequestUser } from "../../modules/auth/auth.types.js";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined>; user?: AuthenticatedRequestUser }>();

    const authHeader = request.headers.authorization;
    const rawToken = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (!rawToken?.startsWith("Bearer ")) {
      throw new UnauthorizedException("缺少访问令牌");
    }

    const token = rawToken.slice("Bearer ".length);
    const payload = await this.authTokenService.verifyAccessToken(token);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException("用户不存在");
    }

    request.user = {
      id: user.id,
      account: user.account,
      phone: user.phone,
      role: user.role,
    };

    return true;
  }
}
