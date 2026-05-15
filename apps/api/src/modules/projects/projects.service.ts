import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  CreateProjectRequest,
  ListProjectsResponse,
  Project,
  ProjectStatus,
} from "@tenio/shared";
import { mockProjects } from "../../mock/projects.js";
import type { ListProjectsDto } from "./dto/list-projects.dto.js";

@Injectable()
export class ProjectsService {
  private readonly projects = new Map<string, Project>(
    mockProjects.map((project) => [project.project_id, project]),
  );

  findAll(query: ListProjectsDto): ListProjectsResponse {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const keyword = query.q?.trim().toLowerCase();
    const status = query.status;

    let items = Array.from(this.projects.values());

    if (keyword) {
      items = items.filter((item) => item.project_name.toLowerCase().includes(keyword));
    }

    if (status) {
      items = items.filter((item) => item.project_status === status);
    }

    const start = (page - 1) * pageSize;
    const pagedItems = items.slice(start, start + pageSize);

    return {
      items: pagedItems,
      total: items.length,
      page,
      page_size: pageSize,
    };
  }

  findOne(projectId: string): Project {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    return project;
  }

  create(payload: CreateProjectRequest): Project {
    const now = new Date().toISOString();
    const projectId = `p_${String(this.projects.size + 1).padStart(3, "0")}`;
    const project: Project = {
      project_id: projectId,
      project_name: payload.project_name,
      project_status: "draft" satisfies ProjectStatus,
      created_at: now,
      updated_at: now,
    };

    this.projects.set(projectId, project);
    return project;
  }
}
