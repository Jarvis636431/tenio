import { GenerationJobStatus, ProjectStatus, UserRole } from "@prisma/client";
import { GenerationService } from "../src/modules/generation/generation.service.js";
import type { GenerationRunner } from "../src/modules/generation/generation.runner.js";
import type { PrismaService } from "../src/prisma/prisma.service.js";

const currentUser = { id: "owner-1", account: "owner", phone: null, role: UserRole.MEMBER };

describe("GenerationService upload flow", () => {
  const job = {
    id: "job-1",
    projectId: "project-1",
    jobStatus: GenerationJobStatus.PENDING,
    progressPercent: 0,
    startedAt: null,
    steps: [],
  };
  const prisma = {
    project: { findFirst: jest.fn(), update: jest.fn() },
    generationJob: { findFirst: jest.fn(), create: jest.fn() },
  };
  const runner = { run: jest.fn() };
  const service = new GenerationService(
    prisma as unknown as PrismaService,
    runner as unknown as GenerationRunner,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.project.findFirst.mockResolvedValue({ id: "project-1" });
    prisma.generationJob.findFirst.mockResolvedValue(null);
    prisma.generationJob.create.mockResolvedValue(job);
    prisma.project.update.mockResolvedValue({ id: "project-1" });
  });

  it("marks a newly uploaded project as generating before starting the runner", async () => {
    await expect(
      service.startGeneration(currentUser, "project-1", { trigger_source: "upload" }),
    ).resolves.toEqual({
      id: "job-1",
      project_id: "project-1",
      status: "pending",
      progress_percent: 0,
      started_at: null,
    });

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "project-1" },
      data: { status: ProjectStatus.GENERATING },
    });
    expect(runner.run).toHaveBeenCalledWith("job-1");
    expect(prisma.project.update.mock.invocationCallOrder[0]).toBeLessThan(
      runner.run.mock.invocationCallOrder[0],
    );
  });

  it("does not change project status for manual regeneration", async () => {
    await service.regenerateArtifacts(currentUser, "project-1", {});

    expect(prisma.project.update).not.toHaveBeenCalled();
    expect(runner.run).toHaveBeenCalledWith("job-1");
  });
});
