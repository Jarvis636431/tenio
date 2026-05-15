import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";
import type { CreateProjectResponse, ListProjectsResponse, Project } from "@tenio/shared";
import { CreateProjectDto } from "./dto/create-project.dto.js";
import { ListProjectsDto } from "./dto/list-projects.dto.js";
import { ProjectsService } from "./projects.service.js";

@Controller("projects")
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly projectsService: ProjectsService) {}

  @Get()
  listProjects(@Query() query: ListProjectsDto): ListProjectsResponse {
    return this.projectsService.findAll(query);
  }

  @Get(":projectId")
  getProject(@Param("projectId") projectId: string): Project {
    return this.projectsService.findOne(projectId);
  }

  @Post()
  createProject(@Body() payload: CreateProjectDto): CreateProjectResponse {
    return this.projectsService.create(payload);
  }
}
