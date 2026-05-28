import { Injectable, Logger } from "@nestjs/common";
import {
  ArtifactType,
  GenerationJobStatus,
  GenerationStepStatus,
  ProjectFileCategory,
  ProjectStatus,
  type Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service.js";
import { ArtifactsService } from "../artifacts/artifacts.service.js";
import { GENERATION_STEPS } from "./generation.constants.js";

type GenerationContext = {
  project: {
    id: string;
    name: string;
  };
  files: Array<{
    id: string;
    originalFileName: string;
    fileSize: number;
    category: ProjectFileCategory;
  }>;
};

@Injectable()
export class GenerationRunner {
  private readonly logger = new Logger(GenerationRunner.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly artifactsService: ArtifactsService,
  ) {}

  run(jobId: string): void {
    void this.runJob(jobId).catch((error: unknown) => {
      this.logger.error(
        `Generation job ${jobId} failed`,
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  private async runJob(jobId: string): Promise<void> {
    const job = await this.prisma.generationJob.findUnique({
      where: { id: jobId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!job || job.jobStatus === GenerationJobStatus.CANCELED) return;

    await this.prisma.generationJob.update({
      where: { id: jobId },
      data: {
        jobStatus: GenerationJobStatus.RUNNING,
        startedAt: job.startedAt ?? new Date(),
      },
    });

    const context = await this.buildContext(job.project.id);

    try {
      await this.runStep(jobId, "parse_files", () => undefined);
      await this.runStep(jobId, "extract_project_info", () => undefined);
      await this.runStep(jobId, "generate_schedule", async () => {
        await this.writeGraphArtifact(context);
      });
      await this.runStep(jobId, "generate_document", async () => {
        await this.writeDocumentArtifact(context);
      });
      await this.runStep(jobId, "generate_time_cost", async () => {
        await this.writeTimeCostArtifact(context);
      });
      await this.runStep(jobId, "generate_crew_plan", async () => {
        await this.writeCrewPlanArtifact(context);
      });
      await this.runStep(jobId, "sync_artifacts", () => undefined);

      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: {
          jobStatus: GenerationJobStatus.SUCCEEDED,
          progressPercent: 100,
          currentStepCode: "sync_artifacts",
          finishedAt: new Date(),
        },
      });
      await this.prisma.project.update({
        where: { id: context.project.id },
        data: { status: ProjectStatus.ACTIVE },
      });
    } catch (error) {
      if (error instanceof GenerationCanceledError) return;

      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: {
          jobStatus: GenerationJobStatus.FAILED,
          errorCode: "GENERATION_FAILED",
          errorMessage: error instanceof Error ? error.message : "生成任务失败",
          finishedAt: new Date(),
        },
      });
      throw error;
    }
  }

  private async buildContext(projectId: string): Promise<GenerationContext> {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        files: {
          where: {
            status: {
              in: ["UPLOADED", "READY"],
            },
          },
          select: {
            id: true,
            originalFileName: true,
            fileSize: true,
            category: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return {
      project: {
        id: project.id,
        name: project.name,
      },
      files: project.files,
    };
  }

  private async runStep(
    jobId: string,
    stepCode: string,
    executor: () => void | Promise<void>,
  ): Promise<void> {
    const job = await this.prisma.generationJob.findUnique({
      where: { id: jobId },
      select: { jobStatus: true },
    });

    if (!job || job.jobStatus === GenerationJobStatus.CANCELED) {
      throw new GenerationCanceledError();
    }

    const step = GENERATION_STEPS.find((item) => item.stepCode === stepCode);
    if (!step) {
      throw new Error(`Unknown generation step: ${stepCode}`);
    }

    await this.prisma.$transaction([
      this.prisma.generationJob.update({
        where: { id: jobId },
        data: {
          currentStepCode: stepCode,
          progressPercent: Math.round(((step.stepOrder - 1) / GENERATION_STEPS.length) * 100),
        },
      }),
      this.prisma.generationStep.update({
        where: { jobId_stepCode: { jobId, stepCode } },
        data: {
          stepStatus: GenerationStepStatus.RUNNING,
          startedAt: new Date(),
        },
      }),
    ]);

    try {
      await executor();
      await this.prisma.$transaction([
        this.prisma.generationStep.update({
          where: { jobId_stepCode: { jobId, stepCode } },
          data: {
            stepStatus: GenerationStepStatus.SUCCEEDED,
            finishedAt: new Date(),
          },
        }),
        this.prisma.generationJob.update({
          where: { id: jobId },
          data: {
            progressPercent: Math.round((step.stepOrder / GENERATION_STEPS.length) * 100),
          },
        }),
      ]);
    } catch (error) {
      await this.prisma.generationStep.update({
        where: { jobId_stepCode: { jobId, stepCode } },
        data: {
          stepStatus: GenerationStepStatus.FAILED,
          finishedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "步骤执行失败",
        },
      });
      throw error;
    }
  }

  private async writeDocumentArtifact(context: GenerationContext): Promise<void> {
    const fileLines = context.files.length
      ? context.files.map((file) => `- ${file.originalFileName}`).join("\n")
      : "- 暂无上传资料";
    const payload = {
      document_title: `${context.project.name}施工组织设计`,
      chapter_count: 5,
      word_count: 1800,
      can_edit: false,
      toc_items: [
        { order_no: 1, title: "工程概况" },
        { order_no: 2, title: "施工部署" },
        { order_no: 3, title: "进度计划" },
        { order_no: 4, title: "资源配置" },
        { order_no: 5, title: "质量与安全措施" },
      ],
      content_markdown: [
        `# ${context.project.name}施工组织设计`,
        "",
        "## 一、工程概况",
        "本方案基于当前上传资料自动生成，用于形成项目初版施工组织设计。",
        "",
        "## 二、资料清单",
        fileLines,
        "",
        "## 三、施工部署",
        "项目采用分阶段组织方式，优先完成现场准备、主体施工、机电安装与竣工收尾。",
        "",
        "## 四、进度计划",
        "初版计划按 90 天总工期编排，后续可基于合同工期和现场约束继续优化。",
        "",
        "## 五、资源配置",
        "建议配置土建、钢筋、模板、机电和综合管理班组，按关键线路动态调整。",
      ].join("\n"),
    };

    await this.artifactsService.createNextArtifactVersion({
      projectId: context.project.id,
      artifactType: ArtifactType.DOCUMENT,
      title: payload.document_title,
      payloadJson: payload,
      summaryJson: { chapter_count: payload.chapter_count, word_count: payload.word_count },
      source: "generation",
    });
  }

  private async writeGraphArtifact(context: GenerationContext): Promise<void> {
    const graph = this.createScheduleTasks();
    const payload = {
      graph,
      resource_pool: { 土建班组: 2, 钢筋班组: 2, 模板班组: 2, 机电班组: 1 },
      version_summary: {
        total_duration_days: 90,
        planned_start_date: "2026-06-01",
        planned_finish_date: "2026-08-29",
        task_count: graph.length,
        critical_task_count: graph.filter((task) => task.isCriticalPath).length,
        resource_pool: { 土建班组: 2, 钢筋班组: 2, 模板班组: 2, 机电班组: 1 },
      },
      compression_summary: [],
    };

    await this.artifactsService.createNextArtifactVersion({
      projectId: context.project.id,
      artifactType: ArtifactType.GRAPH,
      title: `${context.project.name}进度计划`,
      payloadJson: payload as Prisma.InputJsonValue,
      summaryJson: payload.version_summary,
      source: "generation",
    });
  }

  private async writeTimeCostArtifact(context: GenerationContext): Promise<void> {
    const payload = {
      scheme_id: "baseline",
      process_version_id: "v1",
      contract_duration_days: 90,
      optimal_duration_days: 84,
      minimum_total_cost_cents: 126000000,
      saving_rate_percent: 4.8,
      recommendation: {
        recommended_duration_days: 84,
        recommended_min_duration_days: 80,
        recommended_max_duration_days: 90,
        saving_amount_cents: 6300000,
        recommendation_text: "建议采用 84 天资源配置方案，在工期压缩和成本控制之间保持平衡。",
      },
      options: [
        this.createTimeCostOption("plan-90", 90, 132300000, false),
        this.createTimeCostOption("plan-84", 84, 126000000, true),
        this.createTimeCostOption("plan-78", 78, 129800000, false),
      ],
      curve: {
        best_schema_id: "plan-84",
        schema_ids: [90, 84, 78],
        cost: [1323000, 1260000, 1298000],
        direct_cost: [860000, 830000, 870000],
        indirect_cost: [463000, 430000, 428000],
      },
    };

    await this.artifactsService.createNextArtifactVersion({
      projectId: context.project.id,
      artifactType: ArtifactType.TIME_COST,
      title: `${context.project.name}工期成本分析`,
      payloadJson: payload,
      summaryJson: {
        optimal_duration_days: payload.optimal_duration_days,
        minimum_total_cost_cents: payload.minimum_total_cost_cents,
      },
      source: "generation",
    });
  }

  private async writeCrewPlanArtifact(context: GenerationContext): Promise<void> {
    const payload = {
      crew_types: [
        this.createCrewType("civil", "土建班组", "#22D3EE", 2, ["施工准备", "基础施工"]),
        this.createCrewType("rebar", "钢筋班组", "#34D399", 2, ["主体结构"]),
        this.createCrewType("mep", "机电班组", "#FBBF24", 1, ["机电安装", "系统调试"]),
      ],
    };
    const summary = {
      crew_type_count: payload.crew_types.length,
      crew_count: 5,
      crew_task_count: 6,
      planned_start_date: "2026-06-01",
      planned_finish_date: "2026-08-29",
    };

    await this.artifactsService.createNextArtifactVersion({
      projectId: context.project.id,
      artifactType: ArtifactType.CREW_PLAN,
      title: `${context.project.name}人员轮转计划`,
      payloadJson: payload,
      summaryJson: summary,
      source: "generation",
    });
  }

  private createScheduleTasks() {
    return [
      this.createScheduleTask(
        "task-1",
        1,
        "施工准备",
        "土建班组",
        7,
        "2026-06-01",
        "2026-06-07",
        [],
        true,
      ),
      this.createScheduleTask(
        "task-2",
        2,
        "基础施工",
        "土建班组",
        18,
        "2026-06-08",
        "2026-06-25",
        [1],
        true,
      ),
      this.createScheduleTask(
        "task-3",
        3,
        "主体结构",
        "钢筋班组",
        30,
        "2026-06-26",
        "2026-07-25",
        [2],
        true,
      ),
      this.createScheduleTask(
        "task-4",
        4,
        "机电安装",
        "机电班组",
        20,
        "2026-07-26",
        "2026-08-14",
        [3],
        true,
      ),
      this.createScheduleTask(
        "task-5",
        5,
        "装饰收尾",
        "综合班组",
        10,
        "2026-08-15",
        "2026-08-24",
        [4],
        false,
      ),
      this.createScheduleTask(
        "task-6",
        6,
        "验收移交",
        "管理班组",
        5,
        "2026-08-25",
        "2026-08-29",
        [5],
        true,
      ),
    ];
  }

  private createScheduleTask(
    taskId: string,
    seqNo: number,
    taskName: string,
    crewTypeName: string,
    durationDays: number,
    startTime: string,
    endTime: string,
    dependencies: number[],
    isCriticalPath: boolean,
  ) {
    return {
      taskId,
      seqNo,
      taskName,
      crewTypeName,
      crewCount: 1,
      durationDays,
      startTime,
      endTime,
      dependencies,
      taskStatus: "planned",
      indentLevel: 0,
      isSummaryTask: false,
      isCriticalPath,
    };
  }

  private createTimeCostOption(
    optionId: string,
    durationDays: number,
    totalCostCents: number,
    isRecommended: boolean,
  ) {
    return {
      option_id: optionId,
      duration_days: durationDays,
      direct_cost_cents: Math.round(totalCostCents * 0.66),
      rental_cost_cents: Math.round(totalCostCents * 0.08),
      manage_cost_cents: Math.round(totalCostCents * 0.12),
      machine_cost_cents: Math.round(totalCostCents * 0.06),
      indirect_cost_cents: Math.round(totalCostCents * 0.34),
      total_cost_cents: totalCostCents,
      total_crew_count: durationDays <= 84 ? 8 : 6,
      resource_pool: { 土建班组: 2, 钢筋班组: 2, 模板班组: 2, 机电班组: 1 },
      is_recommended: isRecommended,
    };
  }

  private createCrewType(
    crewTypeCode: string,
    crewTypeName: string,
    colorHex: string,
    crewCount: number,
    taskNames: string[],
  ) {
    return {
      crew_type_code: crewTypeCode,
      crew_type_name: crewTypeName,
      color_hex: colorHex,
      crew_count: crewCount,
      crews: Array.from({ length: crewCount }, (_, index) => ({
        crew_id: `${crewTypeCode}-${index + 1}`,
        crew_name: `${crewTypeName}${index + 1}组`,
        task_count: taskNames.length,
        total_work_days: taskNames.length * 10,
        crew_status: "planned",
        tasks: taskNames.map((taskName, taskIndex) => ({
          crew_task_id: `${crewTypeCode}-${index + 1}-${taskIndex + 1}`,
          task_name: taskName,
          work_location: "施工现场",
          start_label: `第 ${taskIndex * 10 + 1} 天`,
          end_label: `第 ${(taskIndex + 1) * 10} 天`,
          duration_label: "10 天",
          start_date: "2026-06-01",
          end_date: "2026-06-10",
        })),
      })),
    };
  }
}

class GenerationCanceledError extends Error {
  constructor() {
    super("生成任务已取消");
    this.name = "GenerationCanceledError";
  }
}
