import { Module } from "@nestjs/common";
import { HealthModule } from "./modules/health/health.module.js";
import { ProjectsModule } from "./modules/projects/projects.module.js";

@Module({
  imports: [HealthModule, ProjectsModule],
})
export class AppModule {}
