import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ProjectFileCategory as PrismaProjectFileCategory,
  ProjectFileStatus as PrismaProjectFileStatus,
} from "@prisma/client";
import type {
  ListProjectFilesResponse,
  ProjectFile,
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

    const storedFileName = this.sanitizeFileName(payload.original_file_name);
    const objectPrefix = `projects/${projectId}/files/${Date.now()}-${storedFileName}`;

    const file = await this.prisma.projectFile.create({
      data: {
        projectId,
        uploadedById: currentUser.id,
        originalFileName: payload.original_file_name,
        storedFileName,
        mimeType: payload.mime_type,
        fileSize: payload.file_size,
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

    await this.prisma.projectFile.update({
      where: { id: file.id },
      data: { status: PrismaProjectFileStatus.UPLOADING },
    });

    return {
      file_id: file.id,
      project_id: projectId,
      storage_bucket: file.storageBucket,
      storage_key: file.storageKey,
      upload_url: presigned.url,
      expires_at: presigned.expires_at,
      headers: presigned.headers,
    };
  }

  async completeUpload(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    payload: UploadCompleteDto,
  ): Promise<UploadCompleteResponse> {
    const file = await this.prisma.projectFile.findFirst({
      where: {
        id: payload.file_id,
        projectId,
        project: { ownerId: currentUser.id },
      },
    });

    if (!file) {
      throw new NotFoundException(`File ${payload.file_id} not found`);
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
      file_id: file.id,
      project_id: file.projectId,
      original_file_name: file.originalFileName,
      stored_file_name: file.storedFileName,
      mime_type: file.mimeType ?? undefined,
      file_size: file.fileSize,
      storage_bucket: file.storageBucket,
      storage_key: file.storageKey,
      category: file.category.toLowerCase() as ProjectFile["category"],
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
      case "cost":
        return PrismaProjectFileCategory.COST;
      case "contract":
        return PrismaProjectFileCategory.CONTRACT;
      case "other":
        return PrismaProjectFileCategory.OTHER;
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.trim().replaceAll(/[^a-zA-Z0-9._-]/g, "_");
  }
}
