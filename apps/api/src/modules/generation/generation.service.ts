import { Injectable, NotFoundException } from "@nestjs/common";
import {
  GenerationJobStatus,
  GenerationStepStatus,
  type GenerationJob,
  type GenerationStep,
  type Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import { GENERATION_STEPS } from "./generation.constants.js";
import type { RegenerateArtifactsDto } from "./dto/regenerate-artifacts.dto.js";
import type { StartGenerationDto } from "./dto/start-generation.dto.js";
import { GenerationRunner } from "./generation.runner.js";
import {
  toGenerationJobStatusValue,
  toGenerationStepStatusValue,
  type GenerationStatusResponse,
  type StartGenerationResponse,
} from "./generation.types.js";

type GenerationJobWithSteps = GenerationJob & {
  steps: GenerationStep[];
};

@Injectable()
export class GenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: GenerationRunner,
  ) {}

  async startGeneration(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    payload: StartGenerationDto,
  ): Promise<StartGenerationResponse> {
    await this.assertProjectAccess(currentUser, projectId);

    const existingJob = await this.findRunningJob(projectId);
    if (existingJob) {
      return this.toStartResponse(existingJob);
    }

    const job = await this.createJob({
      projectId,
      createdByUserId: currentUser.id,
      triggerSource: payload.trigger_source?.trim() || "manual",
      requestJson: {
        trigger_source: payload.trigger_source ?? null,
      },
    });

    this.runner.run(job.id);
    return this.toStartResponse(job);
  }

  async regenerateArtifacts(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    payload: RegenerateArtifactsDto,
  ): Promise<StartGenerationResponse> {
    await this.assertProjectAccess(currentUser, projectId);

    const existingJob = await this.findRunningJob(projectId);
    if (existingJob) {
      return this.toStartResponse(existingJob);
    }

    const job = await this.createJob({
      projectId,
      createdByUserId: currentUser.id,
      triggerSource: "regenerate",
      requestJson: {
        artifact_types: payload.artifact_types ?? null,
        reason: payload.reason ?? null,
      },
    });

    this.runner.run(job.id);
    return this.toStartResponse(job);
  }

  async getGenerationStatus(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
  ): Promise<GenerationStatusResponse> {
    await this.assertProjectAccess(currentUser, projectId);

    const job = await this.prisma.generationJob.findFirst({
      where: { projectId },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    if (!job) {
      throw new NotFoundException(`Generation job for project ${projectId} not found`);
    }

    return this.toStatusResponse(job);
  }

  async cancelGeneration(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
  ): Promise<GenerationStatusResponse> {
    await this.assertProjectAccess(currentUser, projectId);

    const job = await this.findRunningJob(projectId);
    if (!job) {
      const latestJob = await this.prisma.generationJob.findFirst({
        where: { projectId },
        include: { steps: { orderBy: { stepOrder: "asc" } } },
        orderBy: { createdAt: "desc" },
      });
      if (!latestJob) {
        throw new NotFoundException(`Generation job for project ${projectId} not found`);
      }
      return this.toStatusResponse(latestJob);
    }

    const updated = await this.prisma.generationJob.update({
      where: { id: job.id },
      data: {
        jobStatus: GenerationJobStatus.CANCELED,
        finishedAt: new Date(),
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    await this.prisma.generationStep.updateMany({
      where: {
        jobId: updated.id,
        stepStatus: GenerationStepStatus.PENDING,
      },
      data: { stepStatus: GenerationStepStatus.SKIPPED },
    });

    const canceled = await this.prisma.generationJob.findUniqueOrThrow({
      where: { id: updated.id },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    return this.toStatusResponse(canceled);
  }

  private async assertProjectAccess(
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

  private findRunningJob(projectId: string): Promise<GenerationJobWithSteps | null> {
    return this.prisma.generationJob.findFirst({
      where: {
        projectId,
        jobStatus: {
          in: [GenerationJobStatus.PENDING, GenerationJobStatus.RUNNING],
        },
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  private async createJob(input: {
    projectId: string;
    createdByUserId: string;
    triggerSource: string;
    requestJson: Prisma.InputJsonValue;
  }): Promise<GenerationJobWithSteps> {
    return this.prisma.generationJob.create({
      data: {
        projectId: input.projectId,
        createdByUserId: input.createdByUserId,
        triggerSource: input.triggerSource,
        jobStatus: GenerationJobStatus.PENDING,
        progressPercent: 0,
        currentStepCode: GENERATION_STEPS[0]?.stepCode,
        requestJson: input.requestJson,
        steps: {
          create: GENERATION_STEPS.map((step) => ({
            stepCode: step.stepCode,
            stepName: step.stepName,
            stepOrder: step.stepOrder,
            stepStatus: GenerationStepStatus.PENDING,
          })),
        },
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
  }

  private toStartResponse(job: GenerationJob): StartGenerationResponse {
    return {
      generation_job_id: job.id,
      generation_status: toGenerationJobStatusValue(job.jobStatus),
      started_at: (job.startedAt ?? job.createdAt).toISOString(),
    };
  }

  private toStatusResponse(job: GenerationJobWithSteps): GenerationStatusResponse {
    const currentStep =
      job.steps.find((step) => step.stepCode === job.currentStepCode) ?? job.steps[0];

    return {
      generation_job_id: job.id,
      project_id: job.projectId,
      generation_status: toGenerationJobStatusValue(job.jobStatus),
      current_step_code: currentStep?.stepCode ?? "",
      current_step_name: currentStep?.stepName ?? "",
      step_progress_percent: job.progressPercent,
      started_at: (job.startedAt ?? job.createdAt).toISOString(),
      finished_at: job.finishedAt?.toISOString() ?? null,
      steps: job.steps.map((step) => ({
        step_code: step.stepCode,
        step_name: step.stepName,
        step_order: step.stepOrder,
        step_status: toGenerationStepStatusValue(step.stepStatus),
        step_started_at: step.startedAt?.toISOString() ?? null,
        step_finished_at: step.finishedAt?.toISOString() ?? null,
      })),
      error_code: job.errorCode,
      error_message: job.errorMessage,
    };
  }
}
