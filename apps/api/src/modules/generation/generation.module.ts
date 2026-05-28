import { Module } from "@nestjs/common";
import { ArtifactsModule } from "../artifacts/artifacts.module.js";
import { GenerationController } from "./generation.controller.js";
import { GenerationRunner } from "./generation.runner.js";
import { GenerationService } from "./generation.service.js";

@Module({
  imports: [ArtifactsModule],
  controllers: [GenerationController],
  providers: [GenerationService, GenerationRunner],
})
export class GenerationModule {}
