import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { getApiEnv } from "../../config/env.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { AuthTokenService } from "./auth-token.service.js";

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const env = getApiEnv();
        return {
          secret: env.jwtAccessSecret,
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthTokenService],
  exports: [AuthService, AuthTokenService],
})
export class AuthModule {}
