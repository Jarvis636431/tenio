import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ArtifactStatus as PrismaArtifactStatus,
  ArtifactType as PrismaArtifactType,
  type Prisma,
  ProjectStatus as PrismaProjectStatus,
} from "@prisma/client";
import type {
  CrewPlanArtifact,
  CrewPlanCrew,
  CrewPlanGroup,
  CrewPlanTask,
  DocumentArtifact,
  DocumentTocItem,
  ProjectArtifactListResponse,
  ProjectArtifactSummary,
  ScheduleArtifact,
  ScheduleTask,
  TimeCostArtifact,
  TimeCostCurve,
  TimeCostOption,
  TimeCostRecommendation,
  WorkbenchProjectInfo,
  WorkbenchUploadSummaryResponse,
} from "@tenio/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { AuthenticatedRequestUser } from "../auth/auth.types.js";
import { FilesService } from "../files/files.service.js";

type ArtifactRecord = {
  id: string;
  artifactType: PrismaArtifactType;
  artifactVersion: number;
  artifactStatus: PrismaArtifactStatus;
  generatedAt: Date;
  source: string | null;
  payloadJson: Prisma.JsonValue;
  summaryJson: Prisma.JsonValue | null;
};

@Injectable()
export class ArtifactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  async listArtifactSummaries(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
  ): Promise<ProjectArtifactListResponse> {
    await this.ensureOwnedProject(currentUser, projectId);

    const items = await this.prisma.projectArtifact.findMany({
      where: { projectId },
      orderBy: [{ generatedAt: "desc" }, { artifactVersion: "desc" }],
    });

    return {
      items: items.map((item) => this.toArtifactSummary(item)),
    };
  }

  async getLatestDocumentArtifact(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
  ): Promise<DocumentArtifact> {
    const artifact = await this.findLatestArtifact(currentUser, projectId, PrismaArtifactType.DOCUMENT);
    return this.toDocumentArtifact(artifact);
  }

  async getLatestGraphArtifact(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
  ): Promise<ScheduleArtifact> {
    const artifact = await this.findLatestArtifact(currentUser, projectId, PrismaArtifactType.GRAPH);
    return this.toGraphArtifact(artifact);
  }

  async getLatestTimeCostArtifact(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
  ): Promise<TimeCostArtifact> {
    const artifact = await this.findLatestArtifact(currentUser, projectId, PrismaArtifactType.TIME_COST);
    return this.toTimeCostArtifact(artifact);
  }

  async getLatestCrewPlanArtifact(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
  ): Promise<CrewPlanArtifact> {
    const artifact = await this.findLatestArtifact(currentUser, projectId, PrismaArtifactType.CREW_PLAN);
    return this.toCrewPlanArtifact(artifact);
  }

  async getWorkbenchUploadSummary(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
  ): Promise<WorkbenchUploadSummaryResponse> {
    const project = await this.ensureOwnedProject(currentUser, projectId);
    const [files, summaries] = await Promise.all([
      this.filesService.listProjectFiles(currentUser, projectId),
      this.listArtifactSummaries(currentUser, projectId),
    ]);

    const projectInfo: WorkbenchProjectInfo = {
      project_name: project.name,
      contract_duration_days: null,
      contract_amount_cents: null,
      location: null,
      project_subtitle: this.toProjectSubtitle(project.status),
    };

    return {
      project_info: projectInfo,
      files: files.items,
      artifact_summary: {
        ready_artifact_count: summaries.items.filter((item) => item.artifact_status === "ready").length,
        latest_artifacts: summaries.items,
      },
    };
  }

  private async ensureOwnedProject(currentUser: AuthenticatedRequestUser, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: currentUser.id,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    return project;
  }

  private async findLatestArtifact(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    artifactType: PrismaArtifactType,
  ): Promise<ArtifactRecord> {
    await this.ensureOwnedProject(currentUser, projectId);

    const artifact = await this.prisma.projectArtifact.findFirst({
      where: {
        projectId,
        artifactType,
      },
      orderBy: [{ generatedAt: "desc" }, { artifactVersion: "desc" }],
    });

    if (!artifact) {
      throw new NotFoundException(`Latest ${artifactType.toLowerCase()} artifact not found`);
    }

    return artifact;
  }

  private toArtifactSummary(artifact: ArtifactRecord): ProjectArtifactSummary {
    return {
      artifact_id: artifact.id,
      artifact_type: this.toArtifactType(artifact.artifactType),
      artifact_version: artifact.artifactVersion,
      artifact_status: this.toArtifactStatus(artifact.artifactStatus),
      generated_at: artifact.generatedAt.toISOString(),
      source: artifact.source ?? undefined,
      summary: this.asRecordOrUndefined(artifact.summaryJson),
    };
  }

  private toDocumentArtifact(artifact: ArtifactRecord): DocumentArtifact {
    const payload = this.asRecord(artifact.payloadJson);
    return {
      ...this.toArtifactBase(artifact, "document"),
      document_title: this.getString(payload, "document_title") ?? this.getString(payload, "title") ?? "施工组织设计文档",
      chapter_count: this.getNumber(payload, "chapter_count") ?? 0,
      word_count: this.getNumber(payload, "word_count") ?? 0,
      can_edit: this.getBoolean(payload, "can_edit") ?? false,
      toc_items: this.getArray(payload, "toc_items").map((item, index) => this.toTocItem(item, index)),
      content_markdown: this.getString(payload, "content_markdown") ?? "",
    };
  }

  private toGraphArtifact(artifact: ArtifactRecord): ScheduleArtifact {
    const payload = this.asRecord(artifact.payloadJson);
    const summary = this.asRecordOrUndefined(artifact.summaryJson);
    const versionSummary = this.asRecordOrUndefined(payload.version_summary);
    return {
      ...this.toArtifactBase(artifact, "graph"),
      graph: this.getArray(payload, "graph").map((item) => this.toScheduleTask(item)),
      resource_pool: this.toNumberMap(payload.resource_pool),
      version_summary: versionSummary
        ? {
            total_duration_days: this.getNumber(versionSummary, "total_duration_days"),
            planned_start_date: this.getString(versionSummary, "planned_start_date"),
            planned_finish_date: this.getString(versionSummary, "planned_finish_date"),
            task_count: this.getNumber(versionSummary, "task_count"),
            critical_task_count: this.getNumber(versionSummary, "critical_task_count"),
            resource_pool: this.toNumberMap(versionSummary.resource_pool),
          }
        : undefined,
      compression_summary: this.getArray(payload, "compression_summary").map((item) => this.asRecord(item)),
      summary: summary
        ? {
            task_count: this.getNumber(summary, "task_count"),
            critical_task_count: this.getNumber(summary, "critical_task_count"),
            planned_start_date: this.getString(summary, "planned_start_date"),
            planned_finish_date: this.getString(summary, "planned_finish_date"),
            total_duration_days: this.getNumber(summary, "total_duration_days"),
          }
        : undefined,
    };
  }

  private toCrewPlanArtifact(artifact: ArtifactRecord): CrewPlanArtifact {
    const payload = this.asRecord(artifact.payloadJson);
    const summary = this.asRecord(artifact.summaryJson ?? {});
    return {
      ...this.toArtifactBase(artifact, "crew_plan"),
      crew_types: this.getArray(payload, "crew_types").map((item) => this.toCrewPlanGroup(item)),
      summary: {
        crew_type_count: this.getNumber(summary, "crew_type_count") ?? 0,
        crew_count: this.getNumber(summary, "crew_count") ?? 0,
        crew_task_count: this.getNumber(summary, "crew_task_count") ?? 0,
        planned_start_date: this.getString(summary, "planned_start_date") ?? "",
        planned_finish_date: this.getString(summary, "planned_finish_date") ?? "",
      },
    };
  }

  private toTimeCostArtifact(artifact: ArtifactRecord): TimeCostArtifact {
    const payload = this.asRecord(artifact.payloadJson);
    return {
      ...this.toArtifactBase(artifact, "time_cost"),
      scheme_id: this.getNullableString(payload, "scheme_id"),
      process_version_id: this.getNullableString(payload, "process_version_id"),
      contract_duration_days: this.getNumber(payload, "contract_duration_days") ?? 0,
      optimal_duration_days: this.getNumber(payload, "optimal_duration_days") ?? 0,
      minimum_total_cost_cents: this.getNumber(payload, "minimum_total_cost_cents") ?? 0,
      saving_rate_percent: this.getNullableNumber(payload, "saving_rate_percent") ?? null,
      recommendation: this.toTimeCostRecommendation(payload.recommendation),
      options: this.getArray(payload, "options").map((item) => this.toTimeCostOption(item)),
      curve: this.toTimeCostCurve(payload.curve),
    };
  }

  private toArtifactBase<TType extends DocumentArtifact["artifact_type"] | ScheduleArtifact["artifact_type"] | TimeCostArtifact["artifact_type"] | CrewPlanArtifact["artifact_type"]>(
    artifact: ArtifactRecord,
    type: TType,
  ) {
    return {
      artifact_id: artifact.id,
      artifact_type: type,
      artifact_version: artifact.artifactVersion,
      artifact_status: this.toArtifactStatus(artifact.artifactStatus),
      generated_at: artifact.generatedAt.toISOString(),
      source: artifact.source ?? undefined,
    };
  }

  private toTocItem(value: unknown, index: number): DocumentTocItem {
    const item = this.asRecord(value);
    return {
      order_no: this.getNumber(item, "order_no") ?? index + 1,
      title: this.getString(item, "title") ?? `章节 ${index + 1}`,
    };
  }

  private toScheduleTask(value: unknown): ScheduleTask {
    const task = this.asRecord(value);
    return {
      taskId: this.getString(task, "taskId") ?? this.getString(task, "task_id") ?? "",
      seqNo: this.getNumber(task, "seqNo") ?? this.getNumber(task, "seq_no") ?? 0,
      taskName: this.getString(task, "taskName") ?? this.getString(task, "task_name") ?? "",
      crewTypeName:
        this.getString(task, "crewTypeName") ?? this.getString(task, "crew_type_name") ?? "",
      crewCount: this.getNumber(task, "crewCount") ?? this.getNumber(task, "crew_count") ?? 0,
      durationDays:
        this.getNumber(task, "durationDays") ?? this.getNumber(task, "duration_days") ?? 0,
      startTime: this.getString(task, "startTime") ?? this.getString(task, "start_time") ?? "",
      endTime: this.getString(task, "endTime") ?? this.getString(task, "end_time") ?? "",
      dependencies: this.getArray(task, "dependencies").map((item) =>
        typeof item === "number" || typeof item === "string" ? item : String(item),
      ),
      taskStatus: this.getString(task, "taskStatus") ?? this.getString(task, "task_status") ?? undefined,
      indentLevel:
        this.getNumber(task, "indentLevel") ?? this.getNumber(task, "indent_level") ?? undefined,
      isSummaryTask:
        this.getBoolean(task, "isSummaryTask") ??
        this.getBoolean(task, "is_summary_task") ??
        undefined,
      isCriticalPath:
        this.getBoolean(task, "isCriticalPath") ?? this.getBoolean(task, "is_critical_path") ?? false,
    };
  }

  private toCrewPlanGroup(value: unknown): CrewPlanGroup {
    const group = this.asRecord(value);
    return {
      crew_type_code: this.getString(group, "crew_type_code") ?? "",
      crew_type_name: this.getString(group, "crew_type_name") ?? "",
      color_hex: this.getString(group, "color_hex") ?? "#64748B",
      crew_count: this.getNumber(group, "crew_count") ?? 0,
      crews: this.getArray(group, "crews").map((item) => this.toCrewPlanCrew(item)),
    };
  }

  private toCrewPlanCrew(value: unknown): CrewPlanCrew {
    const crew = this.asRecord(value);
    return {
      crew_id: this.getString(crew, "crew_id") ?? "",
      crew_name: this.getString(crew, "crew_name") ?? "",
      task_count: this.getNumber(crew, "task_count") ?? 0,
      total_work_days: this.getNumber(crew, "total_work_days") ?? 0,
      crew_status: this.getString(crew, "crew_status") ?? "unknown",
      tasks: this.getArray(crew, "tasks").map((item) => this.toCrewPlanTask(item)),
    };
  }

  private toCrewPlanTask(value: unknown): CrewPlanTask {
    const task = this.asRecord(value);
    return {
      crew_task_id: this.getString(task, "crew_task_id") ?? "",
      task_name: this.getString(task, "task_name") ?? "",
      work_location: this.getString(task, "work_location") ?? "",
      start_label: this.getString(task, "start_label") ?? "",
      end_label: this.getString(task, "end_label") ?? "",
      duration_label: this.getString(task, "duration_label") ?? "",
      start_date: this.getString(task, "start_date") ?? "",
      end_date: this.getString(task, "end_date") ?? "",
    };
  }

  private toTimeCostRecommendation(value: unknown): TimeCostRecommendation {
    const recommendation = this.asRecord(value);
    return {
      recommended_duration_days: this.getNumber(recommendation, "recommended_duration_days") ?? 0,
      recommended_min_duration_days:
        this.getNumber(recommendation, "recommended_min_duration_days") ?? 0,
      recommended_max_duration_days:
        this.getNumber(recommendation, "recommended_max_duration_days") ?? 0,
      saving_amount_cents: this.getNullableNumber(recommendation, "saving_amount_cents") ?? null,
      recommendation_text: this.getString(recommendation, "recommendation_text") ?? "",
    };
  }

  private toTimeCostOption(value: unknown): TimeCostOption {
    const option = this.asRecord(value);
    return {
      option_id: this.getString(option, "option_id") ?? "",
      duration_days: this.getNumber(option, "duration_days") ?? 0,
      direct_cost_cents: this.getNumber(option, "direct_cost_cents") ?? 0,
      rental_cost_cents: this.getNumber(option, "rental_cost_cents") ?? 0,
      manage_cost_cents: this.getNumber(option, "manage_cost_cents") ?? 0,
      machine_cost_cents: this.getNumber(option, "machine_cost_cents") ?? 0,
      indirect_cost_cents: this.getNumber(option, "indirect_cost_cents") ?? 0,
      total_cost_cents: this.getNumber(option, "total_cost_cents") ?? 0,
      total_crew_count: this.getNumber(option, "total_crew_count") ?? 0,
      resource_pool: this.toNumberMap(option.resource_pool) ?? {},
      is_recommended: this.getBoolean(option, "is_recommended") ?? false,
    };
  }

  private toTimeCostCurve(value: unknown): TimeCostCurve {
    const curve = this.asRecord(value);
    return {
      best_schema_id: this.getString(curve, "best_schema_id") ?? "",
      schema_ids: this.getArray(curve, "schema_ids")
        .map((item) => (typeof item === "number" ? item : Number(item)))
        .filter((item) => Number.isFinite(item)),
      cost: this.getArray(curve, "cost")
        .map((item) => (typeof item === "number" ? item : Number(item)))
        .filter((item) => Number.isFinite(item)),
      direct_cost: this.getArray(curve, "direct_cost")
        .map((item) => (typeof item === "number" ? item : Number(item)))
        .filter((item) => Number.isFinite(item)),
      indirect_cost: this.getArray(curve, "indirect_cost")
        .map((item) => (typeof item === "number" ? item : Number(item)))
        .filter((item) => Number.isFinite(item)),
    };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private asRecordOrUndefined(value: unknown): Record<string, unknown> | undefined {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return undefined;
  }

  private getArray(record: Record<string, unknown>, key: string): unknown[] {
    const value = record[key];
    return Array.isArray(value) ? value : [];
  }

  private getString(record: Record<string, unknown>, key: string): string | undefined {
    const value = record[key];
    return typeof value === "string" ? value : undefined;
  }

  private getNullableString(record: Record<string, unknown>, key: string): string | null | undefined {
    const value = record[key];
    if (value == null) return value as null | undefined;
    return typeof value === "string" ? value : undefined;
  }

  private getNumber(record: Record<string, unknown>, key: string): number | undefined {
    const value = record[key];
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
  }

  private getNullableNumber(record: Record<string, unknown>, key: string): number | null | undefined {
    const value = record[key];
    if (value == null) return value as null | undefined;
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
  }

  private getBoolean(record: Record<string, unknown>, key: string): boolean | undefined {
    const value = record[key];
    return typeof value === "boolean" ? value : undefined;
  }

  private toNumberMap(value: unknown): Record<string, number> | undefined {
    const record = this.asRecordOrUndefined(value);
    if (!record) return undefined;

    return Object.fromEntries(
      Object.entries(record).filter(([, entry]) => typeof entry === "number" && Number.isFinite(entry)),
    ) as Record<string, number>;
  }

  private toArtifactType(type: PrismaArtifactType): ProjectArtifactSummary["artifact_type"] {
    switch (type) {
      case PrismaArtifactType.DOCUMENT:
        return "document";
      case PrismaArtifactType.GRAPH:
        return "graph";
      case PrismaArtifactType.TIME_COST:
        return "time_cost";
      case PrismaArtifactType.CREW_PLAN:
        return "crew_plan";
    }
    throw new Error(`Unsupported artifact type: ${String(type)}`);
  }

  private toArtifactStatus(status: PrismaArtifactStatus): ProjectArtifactSummary["artifact_status"] {
    switch (status) {
      case PrismaArtifactStatus.PROCESSING:
        return "processing";
      case PrismaArtifactStatus.READY:
        return "ready";
      case PrismaArtifactStatus.FAILED:
        return "failed";
      case PrismaArtifactStatus.ARCHIVED:
        return "archived";
    }
    throw new Error(`Unsupported artifact status: ${String(status)}`);
  }

  private toProjectSubtitle(status: PrismaProjectStatus): string {
    switch (status) {
      case PrismaProjectStatus.DRAFT:
        return "草稿项目";
      case PrismaProjectStatus.ACTIVE:
        return "进行中";
      case PrismaProjectStatus.ARCHIVED:
        return "已归档";
    }
  }
}
