import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ProjectFileCategory as PrismaProjectFileCategory,
  ProjectFileStatus as PrismaProjectFileStatus,
} from "@prisma/client";
import type {
  DeleteProjectFileResponse,
  GetProjectFileResponse,
  ListProjectFilesResponse,
  ProjectFile,
  ProjectFileDownloadUrlResponse,
  ProjectFileStatsResponse,
  UploadCompleteResponse,
  UploadInitResponse,
} from "@tenio/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { StorageService } from "../../storage/storage.service.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import type { UploadCompleteDto } from "./dto/upload-complete.dto.js";
import type { UploadInitDto } from "./dto/upload-init.dto.js";

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async initUpload(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    payload: UploadInitDto,
  ): Promise<UploadInitResponse> {
    await this.ensureProjectOwner(currentUser, projectId);

    const storedFileName = this.sanitizeFileName(payload.original_name);
    const objectPrefix = `projects/${projectId}/files/${Date.now()}-${storedFileName}`;

    const file = await this.prisma.projectFile.create({
      data: {
        projectId,
        uploadedById: currentUser.id,
        originalFileName: payload.original_name,
        storedFileName,
        mimeType: payload.mime_type,
        fileSize: payload.size_bytes,
        storageBucket: this.storageService.bucket,
        storageKey: objectPrefix,
        category: this.toPrismaCategory(payload.category),
        status: PrismaProjectFileStatus.PENDING,
      },
    });

    const presigned = await this.storageService.createPresignedUploadUrl({
      key: file.storageKey,
      contentType: payload.mime_type,
    });

    const uploadingFile = await this.prisma.projectFile.update({
      where: { id: file.id },
      data: { status: PrismaProjectFileStatus.UPLOADING },
    });

    return {
      file: this.toProjectFile(uploadingFile),
      upload: {
        url: presigned.url,
        method: "PUT",
        expires_at: presigned.expires_at,
        headers: presigned.headers,
      },
    };
  }

  async completeUpload(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    payload: UploadCompleteDto,
  ): Promise<UploadCompleteResponse> {
    const file = await this.prisma.projectFile.findFirst({
      where: {
        id: payload.id,
        projectId,
        project: { ownerId: currentUser.id },
      },
    });

    if (!file) {
      throw new NotFoundException(`File ${payload.id} not found`);
    }

    const headResult = await this.storageService.headObject(file.storageKey);
    if (!headResult.exists) {
      throw new NotFoundException(`Object ${file.storageKey} not found in storage`);
    }

    const updated = await this.prisma.projectFile.update({
      where: { id: file.id },
      data: {
        status: PrismaProjectFileStatus.UPLOADED,
        mimeType: headResult.content_type ?? file.mimeType,
        fileSize: headResult.content_length ?? file.fileSize,
      },
    });

    return {
      file: this.toProjectFile(updated),
    };
  }

  async listProjectFiles(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
  ): Promise<ListProjectFilesResponse> {
    await this.ensureProjectOwner(currentUser, projectId);

    const items = await this.prisma.projectFile.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return {
      items: items.map((item) => this.toProjectFile(item)),
      total: items.length,
      page: 1,
      page_size: items.length,
    };
  }

  async getProjectFile(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    fileId: string,
  ): Promise<GetProjectFileResponse> {
    const file = await this.findOwnedFile(currentUser, projectId, fileId);
    return { file: this.toProjectFile(file) };
  }

  async getProjectFileStats(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
  ): Promise<ProjectFileStatsResponse> {
    await this.ensureProjectOwner(currentUser, projectId);

    const grouped = await this.prisma.projectFile.groupBy({
      by: ["status"],
      where: { projectId },
      _count: { _all: true },
    });

    const countByStatus = new Map(grouped.map((item) => [item.status, item._count._all]));

    return {
      total_files: grouped.reduce((sum, item) => sum + item._count._all, 0),
      pending_files:
        (countByStatus.get(PrismaProjectFileStatus.PENDING) ?? 0) +
        (countByStatus.get(PrismaProjectFileStatus.UPLOADING) ?? 0),
      uploaded_files: countByStatus.get(PrismaProjectFileStatus.UPLOADED) ?? 0,
      ready_files: countByStatus.get(PrismaProjectFileStatus.READY) ?? 0,
      failed_files: countByStatus.get(PrismaProjectFileStatus.FAILED) ?? 0,
    };
  }

  async deleteProjectFile(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    fileId: string,
  ): Promise<DeleteProjectFileResponse> {
    const file = await this.findOwnedFile(currentUser, projectId, fileId);

    await this.storageService.deleteObject(file.storageKey);
    await this.prisma.projectFile.delete({
      where: { id: file.id },
    });

    return {
      id: file.id,
    };
  }

  async getProjectFileDownloadUrl(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    fileId: string,
  ): Promise<ProjectFileDownloadUrlResponse> {
    const file = await this.findOwnedFile(currentUser, projectId, fileId);
    const download = await this.storageService.createPresignedDownloadUrl(file.storageKey);

    return {
      id: file.id,
      url: download.url,
      expires_at: download.expires_at,
    };
  }

  private async ensureProjectOwner(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
  ): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: currentUser.id,
      },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  private async findOwnedFile(currentUser: AuthenticatedRequestUser, projectId: string, fileId: string) {
    const file = await this.prisma.projectFile.findFirst({
      where: {
        id: fileId,
        projectId,
        project: { ownerId: currentUser.id },
      },
    });

    if (!file) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    return file;
  }

  private toProjectFile(file: {
    id: string;
    projectId: string;
    originalFileName: string;
    storedFileName: string;
    mimeType: string | null;
    fileSize: number;
    storageBucket: string;
    storageKey: string;
    category: PrismaProjectFileCategory;
    status: PrismaProjectFileStatus;
    createdAt: Date;
    updatedAt: Date;
  }): ProjectFile {
    return {
      id: file.id,
      project_id: file.projectId,
      original_name: file.originalFileName,
      mime_type: file.mimeType ?? undefined,
      size_bytes: file.fileSize,
      category: this.toProjectFileCategory(file.category),
      status: file.status.toLowerCase() as ProjectFile["status"],
      created_at: file.createdAt.toISOString(),
      updated_at: file.updatedAt.toISOString(),
    };
  }

  private toPrismaCategory(category: ProjectFile["category"]): PrismaProjectFileCategory {
    switch (category) {
      case "model":
        return PrismaProjectFileCategory.MODEL;
      case "drawing":
        return PrismaProjectFileCategory.DRAWING;
      case "schedule":
        return PrismaProjectFileCategory.SCHEDULE;
      case "bill":
        return PrismaProjectFileCategory.COST;
      case "contract":
        return PrismaProjectFileCategory.CONTRACT;
      case "site_photo":
        return PrismaProjectFileCategory.OTHER;
      case "other":
        return PrismaProjectFileCategory.OTHER;
    }
  }

  private toProjectFileCategory(category: PrismaProjectFileCategory): ProjectFile["category"] {
    switch (category) {
      case PrismaProjectFileCategory.MODEL:
        return "model";
      case PrismaProjectFileCategory.DRAWING:
        return "drawing";
      case PrismaProjectFileCategory.SCHEDULE:
        return "schedule";
      case PrismaProjectFileCategory.COST:
        return "bill";
      case PrismaProjectFileCategory.CONTRACT:
        return "contract";
      case PrismaProjectFileCategory.OTHER:
        return "other";
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.trim().replaceAll(/[^a-zA-Z0-9._-]/g, "_");
  }
}
