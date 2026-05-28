import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import { RegenerateArtifactsDto } from "./dto/regenerate-artifacts.dto.js";
import { StartGenerationDto } from "./dto/start-generation.dto.js";
import { GenerationService } from "./generation.service.js";
import type { GenerationStatusResponse, StartGenerationResponse } from "./generation.types.js";

@Controller("projects/:projectId/generation")
@UseGuards(JwtAuthGuard)
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post("start")
  startGeneration(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Body() payload: StartGenerationDto,
  ): Promise<StartGenerationResponse> {
    return this.generationService.startGeneration(currentUser, projectId, payload);
  }

  @Get("status")
  getGenerationStatus(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
  ): Promise<GenerationStatusResponse> {
    return this.generationService.getGenerationStatus(currentUser, projectId);
  }

  @Post("cancel")
  cancelGeneration(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
  ): Promise<GenerationStatusResponse> {
    return this.generationService.cancelGeneration(currentUser, projectId);
  }

  @Post("regenerate")
  regenerateArtifacts(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Body() payload: RegenerateArtifactsDto,
  ): Promise<StartGenerationResponse> {
    return this.generationService.regenerateArtifacts(currentUser, projectId, payload);
  }
}
