import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomUUID } from "node:crypto";
import type { User } from "@prisma/client";
import type { AuthSession } from "@tenio/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { getApiEnv } from "../../config/env.js";
import { toAuthUser } from "./auth.mapper.js";
import type { AccessTokenPayload, RefreshTokenPayload } from "./auth.types.js";

@Injectable()
export class AuthTokenService {
  private readonly env = getApiEnv();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async issueSession(user: User): Promise<AuthSession> {
    const accessExpiresIn = this.env.jwtAccessExpiresIn as `${number}${"ms" | "s" | "m" | "h" | "d"}`;
    const refreshExpiresIn = this.env.jwtRefreshExpiresIn as `${number}${"ms" | "s" | "m" | "h" | "d"}`;
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      account: user.account,
      role: user.role,
      type: "access",
    };

    const refreshJti = randomUUID();
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti: refreshJti,
      type: "refresh",
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.env.jwtAccessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.env.jwtRefreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        jti: refreshJti,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: this.decodeRefreshExpiry(refreshToken),
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      user: toAuthUser(user),
    };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.env.jwtAccessSecret,
      });
    } catch {
      throw new UnauthorizedException("访问令牌无效或已过期");
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.env.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException("刷新令牌无效或已过期");
    }
  }

  async rotateRefreshToken(token: string): Promise<AuthSession> {
    const payload = await this.verifyRefreshToken(token);
    const record = await this.prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
      include: { user: true },
    });

    if (
      !record ||
      record.userId !== payload.sub ||
      record.revokedAt ||
      record.expiresAt.getTime() <= Date.now() ||
      record.tokenHash !== this.hashToken(token)
    ) {
      throw new UnauthorizedException("刷新令牌不可用");
    }

    await this.prisma.refreshToken.update({
      where: { jti: payload.jti },
      data: { revokedAt: new Date() },
    });

    return this.issueSession(record.user);
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashToken(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }

  private decodeRefreshExpiry(token: string) {
    const payload = this.jwtService.decode(token) as { exp?: number } | null;
    if (!payload?.exp) {
      throw new UnauthorizedException("刷新令牌缺少过期时间");
    }
    return new Date(payload.exp * 1000);
  }
}
