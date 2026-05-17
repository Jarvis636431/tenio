import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from "@nestjs/common";
import type { CreateProjectResponse, ListProjectsResponse, Project } from "@tenio/shared";
import { CurrentUser } from "../../common/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import { CreateProjectDto } from "./dto/create-project.dto.js";
import { ListProjectsDto } from "./dto/list-projects.dto.js";
import { ProjectsService } from "./projects.service.js";

@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly projectsService: ProjectsService) {}

  @Get()
  listProjects(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Query() query: ListProjectsDto,
  ): Promise<ListProjectsResponse> {
    return this.projectsService.findAll(currentUser, query);
  }

  @Get(":projectId")
  getProject(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Param("projectId") projectId: string,
  ): Promise<Project> {
    return this.projectsService.findOne(currentUser, projectId);
  }

  @Post()
  createProject(
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Body() payload: CreateProjectDto,
  ): Promise<CreateProjectResponse> {
    return this.projectsService.create(currentUser, payload);
  }
}
