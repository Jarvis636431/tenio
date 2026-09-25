import { ArtifactStatus, GenerationJobStatus, ProjectStatus, UserRole } from "@prisma/client";
import { NotFoundException } from "@nestjs/common";
import { validateSync } from "class-validator";
import { ListProjectsDto } from "../src/modules/projects/dto/list-projects.dto.js";
import { ProjectsService } from "../src/modules/projects/projects.service.js";
import type { PrismaService } from "../src/prisma/prisma.service.js";
import type { StorageService } from "../src/storage/storage.service.js";

const currentUser = { id: "owner-1", account: "owner", phone: null, role: UserRole.MEMBER };

describe("ProjectsService frontend contract", () => {
  const prisma = {
    project: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    projectArtifact: { count: jest.fn() },
    generationJob: { findMany: jest.fn() },
  };
  const storage = { deleteObject: jest.fn() };
  const service = new ProjectsService(
    prisma as unknown as PrismaService,
    storage as unknown as StorageService,
  );

  beforeEach(() => jest.clearAllMocks());

  it.each(["draft", "uploading", "generating", "active", "failed", "archived"])(
    "accepts the frontend's %s status filter",
    (status) => {
      const query = new ListProjectsDto();
      query.status = status as ListProjectsDto["status"];
      expect(validateSync(query)).toEqual([]);
    },
  );

  it("returns dashboard metrics scoped to the current owner", async () => {
    prisma.project.count.mockResolvedValueOnce(4).mockResolvedValueOnce(2);
    prisma.projectArtifact.count.mockResolvedValue(7);
    prisma.generationJob.findMany.mockResolvedValue([
      {
        startedAt: new Date("2026-01-01T00:00:00Z"),
        finishedAt: new Date("2026-01-01T00:00:30Z"),
      },
      {
        startedAt: new Date("2026-01-01T00:00:00Z"),
        finishedAt: new Date("2026-01-01T00:01:00Z"),
      },
    ]);

    await expect(service.getMetrics(currentUser)).resolves.toEqual({
      total_count: 4,
      in_progress_count: 2,
      ready_artifact_count: 7,
      average_generation_seconds: 45,
      managed_count: 4,
    });
    expect(prisma.project.count).toHaveBeenNthCalledWith(2, {
      where: {
        ownerId: currentUser.id,
        status: {
          in: [ProjectStatus.UPLOADING, ProjectStatus.GENERATING, ProjectStatus.ACTIVE],
        },
      },
    });
    expect(prisma.projectArtifact.count).toHaveBeenCalledWith({
      where: { project: { ownerId: currentUser.id }, artifactStatus: ArtifactStatus.READY },
    });
    expect(prisma.generationJob.findMany).toHaveBeenCalledWith({
      where: {
        project: { ownerId: currentUser.id },
        jobStatus: GenerationJobStatus.SUCCEEDED,
        startedAt: { not: null },
        finishedAt: { not: null },
      },
      select: { startedAt: true, finishedAt: true },
    });
  });

  it("includes each project's ready artifact count in the list", async () => {
    prisma.project.count.mockResolvedValue(1);
    prisma.project.findMany.mockResolvedValue([
      {
        id: "project-1",
        name: "项目一",
        status: ProjectStatus.ACTIVE,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-02T00:00:00Z"),
        _count: { artifacts: 3 },
      },
    ]);

    const result = await service.findAll(currentUser, { page: 1, page_size: 20 });

    expect(result.items[0]).toMatchObject({
      id: "project-1",
      status: "active",
      ready_artifact_count: 3,
    });
    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: { ownerId: currentUser.id },
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 20,
      include: {
        _count: {
          select: {
            artifacts: { where: { artifactStatus: ArtifactStatus.READY } },
          },
        },
      },
    });
  });

  it("deletes owned project files from storage before cascading the project", async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: "project-1",
      files: [{ storageKey: "one" }, { storageKey: "two" }],
    });
    storage.deleteObject.mockResolvedValue(undefined);
    prisma.project.delete.mockResolvedValue({ id: "project-1" });

    await expect(service.delete(currentUser, "project-1")).resolves.toEqual({ id: "project-1" });
    expect(prisma.project.findFirst).toHaveBeenCalledWith({
      where: { id: "project-1", ownerId: currentUser.id },
      select: { id: true, files: { select: { storageKey: true } } },
    });
    expect(storage.deleteObject).toHaveBeenCalledTimes(2);
    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: "project-1" } });
  });

  it("does not delete a project owned by another user", async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(service.delete(currentUser, "project-2")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(storage.deleteObject).not.toHaveBeenCalled();
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });

  it("keeps the project record when object storage cleanup fails", async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: "project-1",
      files: [{ storageKey: "one" }],
    });
    storage.deleteObject.mockRejectedValue(new Error("storage unavailable"));

    await expect(service.delete(currentUser, "project-1")).rejects.toThrow("storage unavailable");
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });
});
