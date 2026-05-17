import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import type {
  CrewPlanArtifact,
  DocumentArtifact,
  ProjectArtifactListResponse,
  ScheduleArtifact,
  TimeCostArtifact,
  WorkbenchUploadSummaryResponse,
} from "@tenio/shared";
import { CurrentUser } from "../../common/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import { ArtifactsService } from "./artifacts.service.js";

@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ArtifactsController {
  constructor(private readonly artifactsService: ArtifactsService) {}

  @Get(":projectId/artifacts")
  listArtifactSummaries(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
  ): Promise<ProjectArtifactListResponse> {
    return this.artifactsService.listArtifactSummaries(currentUser, projectId);
  }

  @Get(":projectId/artifacts/document/latest")
  getLatestDocumentArtifact(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
  ): Promise<DocumentArtifact> {
    return this.artifactsService.getLatestDocumentArtifact(currentUser, projectId);
  }

  @Get(":projectId/artifacts/graph/latest")
  getLatestGraphArtifact(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
  ): Promise<ScheduleArtifact> {
    return this.artifactsService.getLatestGraphArtifact(currentUser, projectId);
  }

  @Get(":projectId/artifacts/time-cost/latest")
  getLatestTimeCostArtifact(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
  ): Promise<TimeCostArtifact> {
    return this.artifactsService.getLatestTimeCostArtifact(currentUser, projectId);
  }

  @Get(":projectId/artifacts/crew-plan/latest")
  getLatestCrewPlanArtifact(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
  ): Promise<CrewPlanArtifact> {
    return this.artifactsService.getLatestCrewPlanArtifact(currentUser, projectId);
  }

  @Get(":projectId/workbench/upload-summary")
  getWorkbenchUploadSummary(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
  ): Promise<WorkbenchUploadSummaryResponse> {
    return this.artifactsService.getWorkbenchUploadSummary(currentUser, projectId);
  }
}
