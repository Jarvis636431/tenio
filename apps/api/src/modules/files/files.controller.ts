import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type {
  ListProjectFilesResponse,
  ProjectFileStatsResponse,
  UploadCompleteResponse,
  UploadInitResponse,
} from "@tenio/shared";
import { CurrentUser } from "../../common/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import { UploadCompleteDto } from "./dto/upload-complete.dto.js";
import { UploadInitDto } from "./dto/upload-init.dto.js";
import { FilesService } from "./files.service.js";

@Controller("projects/:projectId/files")
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload-init")
  initUpload(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Body() payload: UploadInitDto,
  ): Promise<UploadInitResponse> {
    return this.filesService.initUpload(currentUser, projectId, payload);
  }

  @Post("complete")
  completeUpload(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Body() payload: UploadCompleteDto,
  ): Promise<UploadCompleteResponse> {
    return this.filesService.completeUpload(currentUser, projectId, payload);
  }

  @Get()
  listFiles(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
  ): Promise<ListProjectFilesResponse> {
    return this.filesService.listProjectFiles(currentUser, projectId);
  }

  @Get("stats")
  getFileStats(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
  ): Promise<ProjectFileStatsResponse> {
    return this.filesService.getProjectFileStats(currentUser, projectId);
  }
}
