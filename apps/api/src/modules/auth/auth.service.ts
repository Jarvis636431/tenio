import { BadRequestException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { createHash } from "node:crypto";
import type {
  AuthSession,
  AuthUser,
  SendSmsResponse,
  SetupProfileResponse,
} from "@tenio/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { getApiEnv } from "../../config/env.js";
import { DEV_SMS_LOGIN_CODE } from "./auth.constants.js";
import { toAuthUser, toSetupProfileResponse } from "./auth.mapper.js";
import { AuthTokenService } from "./auth-token.service.js";
import type { AuthenticatedRequestUser } from "./auth.types.js";
import type { PasswordLoginDto } from "./dto/password-login.dto.js";
import type { RefreshTokenDto } from "./dto/refresh-token.dto.js";
import type { SendSmsDto } from "./dto/send-sms.dto.js";
import type { SetupProfileDto } from "./dto/setup-profile.dto.js";
import type { SmsLoginDto } from "./dto/sms-login.dto.js";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly env = getApiEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async sendLoginSms(payload: SendSmsDto): Promise<SendSmsResponse> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.env.smsCodeTtlSeconds * 1000);

    await this.prisma.smsCode.create({
      data: {
        phone: payload.phone,
        codeHash: this.hashSmsCode(DEV_SMS_LOGIN_CODE),
        expiresAt,
      },
    });

    if (process.env.NODE_ENV !== "production") {
      this.logger.debug(`sms code for ${payload.phone}: ${DEV_SMS_LOGIN_CODE}`);
    }

    return {
      phone: payload.phone,
      cooldown_seconds: this.env.smsCodeCooldownSeconds,
      sent_at: now.toISOString(),
    };
  }

  async loginWithSms(payload: SmsLoginDto): Promise<AuthSession> {
    if (!payload.has_agreed_terms) {
      throw new BadRequestException("请先同意服务协议");
    }

    const code = await this.prisma.smsCode.findFirst({
      where: {
        phone: payload.phone,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!code || code.codeHash !== this.hashSmsCode(payload.sms_code)) {
      throw new UnauthorizedException("验证码错误或已过期");
    }

    await this.prisma.smsCode.update({
      where: { id: code.id },
      data: { consumedAt: new Date() },
    });

    let user = await this.prisma.user.findFirst({
      where: { phone: payload.phone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: payload.phone,
          account: payload.phone,
          username: payload.phone,
          displayName: payload.phone,
          role: UserRole.MEMBER,
          isProfileCompleted: false,
        },
      });
    }

    return this.authTokenService.issueSession(user);
  }

  async loginWithPassword(payload: PasswordLoginDto): Promise<AuthSession> {
    if (!payload.has_agreed_terms) {
      throw new BadRequestException("请先同意服务协议");
    }

    const user = await this.prisma.user.findUnique({
      where: { account: payload.account },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException("账号或密码错误");
    }

    const passwordValid = await compare(payload.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException("账号或密码错误");
    }

    return this.authTokenService.issueSession(user);
  }

  async refreshSession(payload: RefreshTokenDto): Promise<AuthSession> {
    return this.authTokenService.rotateRefreshToken(payload.refresh_token);
  }

  async logout(user?: AuthenticatedRequestUser): Promise<void> {
    if (!user) {
      return;
    }

    await this.authTokenService.revokeAllUserRefreshTokens(user.id);
  }

  async setupProfile(
    currentUser: AuthenticatedRequestUser,
    payload: SetupProfileDto,
  ): Promise<SetupProfileResponse> {
    const passwordHash = await hash(payload.password, 10);
    const user = await this.prisma.user.update({
      where: { id: currentUser.id },
      data: {
        username: payload.username,
        displayName: payload.username,
        passwordHash,
        isProfileCompleted: true,
      },
    });

    return toSetupProfileResponse(user);
  }

  async getCurrentUser(currentUser: AuthenticatedRequestUser): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) {
      throw new UnauthorizedException("当前用户不存在");
    }

    return toAuthUser(user);
  }

  private hashSmsCode(code: string) {
    return createHash("sha256").update(code).digest("hex");
  }
}
