import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import type {
  DeleteProjectFileResponse,
  GetProjectFileResponse,
  ListProjectFilesResponse,
  ProjectFileDownloadUrlResponse,
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

@Controller("projects/:projectId")
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("uploads/init")
  initUpload(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Body() payload: UploadInitDto,
  ): Promise<UploadInitResponse> {
    return this.filesService.initUpload(currentUser, projectId, payload);
  }

  @Post("uploads/complete")
  completeUpload(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Body() payload: UploadCompleteDto,
  ): Promise<UploadCompleteResponse> {
    return this.filesService.completeUpload(currentUser, projectId, payload);
  }

  @Get("files")
  listFiles(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
  ): Promise<ListProjectFilesResponse> {
    return this.filesService.listProjectFiles(currentUser, projectId);
  }

  @Get("files/:fileId")
  getFile(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Param("fileId") fileId: string,
  ): Promise<GetProjectFileResponse> {
    return this.filesService.getProjectFile(currentUser, projectId, fileId);
  }

  @Get("files/stats")
  getFileStats(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
  ): Promise<ProjectFileStatsResponse> {
    return this.filesService.getProjectFileStats(currentUser, projectId);
  }

  @Get("files/:fileId/download-url")
  getFileDownloadUrl(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Param("fileId") fileId: string,
  ): Promise<ProjectFileDownloadUrlResponse> {
    return this.filesService.getProjectFileDownloadUrl(currentUser, projectId, fileId);
  }

  @Delete("files/:fileId")
  deleteFile(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
    @Param("fileId") fileId: string,
  ): Promise<DeleteProjectFileResponse> {
    return this.filesService.deleteProjectFile(currentUser, projectId, fileId);
  }
}
