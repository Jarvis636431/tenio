import { Injectable, NotFoundException } from "@nestjs/common";
import { ProjectStatus as PrismaProjectStatus } from "@prisma/client";
import type {
  CreateProjectRequest,
  ListProjectsResponse,
  Project,
} from "@tenio/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import type { ListProjectsDto } from "./dto/list-projects.dto.js";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

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
      }),
    ]);

    return {
      items: items.map((item) => this.toProject(item)),
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
        name: payload.project_name,
        status: PrismaProjectStatus.DRAFT,
      },
    });

    return this.toProject(project);
  }

  async archive(currentUser: AuthenticatedRequestUser, projectId: string): Promise<Project> {
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
        status: PrismaProjectStatus.ARCHIVED,
      },
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
      project_id: project.id,
      project_name: project.name,
      project_status: project.status.toLowerCase() as Project["project_status"],
      created_at: project.createdAt.toISOString(),
      updated_at: project.updatedAt.toISOString(),
    };
  }

  private toPrismaStatus(status: Project["project_status"]): PrismaProjectStatus {
    switch (status) {
      case "draft":
        return PrismaProjectStatus.DRAFT;
      case "active":
        return PrismaProjectStatus.ACTIVE;
      case "archived":
        return PrismaProjectStatus.ARCHIVED;
    }
  }
}
