import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ArtifactStatus as PrismaArtifactStatus,
  GenerationJobStatus as PrismaGenerationJobStatus,
  ProjectStatus as PrismaProjectStatus,
} from "@prisma/client";
import type {
  CreateProjectRequest,
  ListProjectsResponse,
  Project,
  ProjectMetrics,
} from "@tenio/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { StorageService } from "../../storage/storage.service.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import type { ListProjectsDto } from "./dto/list-projects.dto.js";

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getMetrics(currentUser: AuthenticatedRequestUser): Promise<ProjectMetrics> {
    const ownedProjects = { ownerId: currentUser.id };
    const [totalCount, inProgressCount, readyArtifactCount, completedJobs] = await Promise.all([
      this.prisma.project.count({ where: ownedProjects }),
      this.prisma.project.count({
        where: {
          ...ownedProjects,
          status: {
            in: [
              PrismaProjectStatus.UPLOADING,
              PrismaProjectStatus.GENERATING,
              PrismaProjectStatus.ACTIVE,
            ],
          },
        },
      }),
      this.prisma.projectArtifact.count({
        where: {
          project: ownedProjects,
          artifactStatus: PrismaArtifactStatus.READY,
        },
      }),
      this.prisma.generationJob.findMany({
        where: {
          project: ownedProjects,
          jobStatus: PrismaGenerationJobStatus.SUCCEEDED,
          startedAt: { not: null },
          finishedAt: { not: null },
        },
        select: { startedAt: true, finishedAt: true },
      }),
    ]);

    const totalDurationMs = completedJobs.reduce((sum, job) => {
      if (!job.startedAt || !job.finishedAt) return sum;
      return sum + Math.max(0, job.finishedAt.getTime() - job.startedAt.getTime());
    }, 0);

    return {
      total_count: totalCount,
      in_progress_count: inProgressCount,
      ready_artifact_count: readyArtifactCount,
      average_generation_seconds: completedJobs.length
        ? Math.round(totalDurationMs / completedJobs.length / 1000)
        : 0,
      managed_count: totalCount,
    };
  }

  async findAll(
    currentUser: AuthenticatedRequestUser,
    query: ListProjectsDto,
  ): Promise<ListProjectsResponse> {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const keyword = query.q?.trim().toLowerCase();
    const status = query.status;

    const start = (page - 1) * pageSize;
    const where = {
      ownerId: currentUser.id,
      ...(keyword
        ? {
            name: {
              contains: keyword,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(status
        ? {
            status: this.toPrismaStatus(status),
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: start,
        take: pageSize,
        include: {
          _count: {
            select: {
              artifacts: { where: { artifactStatus: PrismaArtifactStatus.READY } },
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...this.toProject(item),
        ready_artifact_count: item._count.artifacts,
      })),
      total,
      page,
      page_size: pageSize,
    };
  }

  async findOne(currentUser: AuthenticatedRequestUser, projectId: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: currentUser.id,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    return this.toProject(project);
  }

  async create(
    currentUser: AuthenticatedRequestUser,
    payload: CreateProjectRequest,
  ): Promise<Project> {
    const project = await this.prisma.project.create({
      data: {
        ownerId: currentUser.id,
        name: payload.name,
        status: PrismaProjectStatus.DRAFT,
      },
    });

    return this.toProject(project);
  }

  async delete(currentUser: AuthenticatedRequestUser, projectId: string): Promise<{ id: string }> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, ownerId: currentUser.id },
      select: { id: true, files: { select: { storageKey: true } } },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    for (const file of project.files) {
      await this.storageService.deleteObject(file.storageKey);
    }
    await this.prisma.project.delete({ where: { id: project.id } });
    return { id: project.id };
  }

  async archive(currentUser: AuthenticatedRequestUser, projectId: string): Promise<Project> {
    return this.updateStatus(currentUser, projectId, PrismaProjectStatus.ARCHIVED);
  }

  async activate(currentUser: AuthenticatedRequestUser, projectId: string): Promise<Project> {
    return this.updateStatus(currentUser, projectId, PrismaProjectStatus.ACTIVE);
  }

  async rename(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    projectName: string,
  ): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: currentUser.id,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data: {
        name: projectName,
      },
    });

    return this.toProject(updated);
  }

  private async updateStatus(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    status: PrismaProjectStatus,
  ): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: currentUser.id,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data: { status },
    });

    return this.toProject(updated);
  }

  private toProject(project: {
    id: string;
    name: string;
    status: PrismaProjectStatus;
    createdAt: Date;
    updatedAt: Date;
  }): Project {
    return {
      id: project.id,
      name: project.name,
      status: project.status.toLowerCase() as Project["status"],
      created_at: project.createdAt.toISOString(),
      updated_at: project.updatedAt.toISOString(),
    };
  }

  private toPrismaStatus(status: Project["status"]): PrismaProjectStatus {
    switch (status) {
      case "draft":
        return PrismaProjectStatus.DRAFT;
      case "uploading":
        return PrismaProjectStatus.UPLOADING;
      case "generating":
        return PrismaProjectStatus.GENERATING;
      case "active":
        return PrismaProjectStatus.ACTIVE;
      case "failed":
        return PrismaProjectStatus.FAILED;
      case "archived":
        return PrismaProjectStatus.ARCHIVED;
    }
  }
}
