import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module.js";
import { FilesModule } from "./modules/files/files.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ProjectsModule } from "./modules/projects/projects.module.js";
import { StorageModule } from "./storage/storage.module.js";

@Module({
  imports: [PrismaModule, StorageModule, AuthModule, HealthModule, ProjectsModule, FilesModule],
})
export class AppModule {}
