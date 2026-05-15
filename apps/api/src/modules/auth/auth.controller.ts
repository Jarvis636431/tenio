import { Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";
import type {
  AuthSession,
  AuthUser,
  SendSmsResponse,
  SetupProfileResponse,
} from "@tenio/shared";
import { CurrentUser } from "../../common/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard.js";
import type { AuthenticatedRequestUser } from "./auth.types.js";
import { AuthService } from "./auth.service.js";
import { PasswordLoginDto } from "./dto/password-login.dto.js";
import { RefreshTokenDto } from "./dto/refresh-token.dto.js";
import { SendSmsDto } from "./dto/send-sms.dto.js";
import { SetupProfileDto } from "./dto/setup-profile.dto.js";
import { SmsLoginDto } from "./dto/sms-login.dto.js";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("auth/sms/send")
  sendSms(@Body() payload: SendSmsDto): Promise<SendSmsResponse> {
    return this.authService.sendLoginSms(payload);
  }

  @Post("auth/login/sms")
  loginWithSms(@Body() payload: SmsLoginDto): Promise<AuthSession> {
    return this.authService.loginWithSms(payload);
  }

  @Post("auth/login/password")
  loginWithPassword(@Body() payload: PasswordLoginDto): Promise<AuthSession> {
    return this.authService.loginWithPassword(payload);
  }

  @Post("auth/refresh")
  refresh(@Body() payload: RefreshTokenDto): Promise<AuthSession> {
    return this.authService.refreshSession(payload);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Post("auth/logout")
  async logout(@CurrentUser() currentUser: AuthenticatedRequestUser): Promise<void> {
    await this.authService.logout(currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Post("auth/setup-profile")
  setupProfile(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Body() payload: SetupProfileDto,
  ): Promise<SetupProfileResponse> {
    return this.authService.setupProfile(currentUser, payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@CurrentUser() currentUser: AuthenticatedRequestUser): Promise<AuthUser> {
    return this.authService.getCurrentUser(currentUser);
  }
}
