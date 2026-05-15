import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ProjectsModule } from "./modules/projects/projects.module.js";

@Module({
  imports: [PrismaModule, AuthModule, HealthModule, ProjectsModule],
})
export class AppModule {}
