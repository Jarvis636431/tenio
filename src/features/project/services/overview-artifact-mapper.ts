import type { ScheduleArtifact, ScheduleTask, TimeCostArtifact } from "./project-api";
import type { PlanTask } from "@/types/domain/plan";

interface CostCurvePoint {
  date: string;
  总成本: number;
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function resolveCostValue(record: Record<string, unknown>) {
  const cents = readNumber(record, [
    "total_cost_cents",
    "minimum_total_cost_cents",
    "cost_cents",
    "total_amount_cents",
  ]);
  if (cents !== null) return cents / 100;

  return readNumber(record, ["total_cost", "minimum_total_cost", "cost", "total_amount", "amount"]);
}

function resolveCostLabel(record: Record<string, unknown>, index: number) {
  const directLabel = readString(record, ["date", "label", "option_name", "scheme_name"]);
  if (directLabel) return directLabel;

  const duration = readNumber(record, [
    "duration_days",
    "optimal_duration_days",
    "contract_duration_days",
    "days",
  ]);
  if (duration !== null) return `方案${duration}天`;

  return `方案${index + 1}`;
}

/**
 * 将新版进度计划产物转换为工作台通用任务模型。
 */
export function mapScheduleArtifactToPlanTasks(artifact?: ScheduleArtifact | null): PlanTask[] {
  if (!artifact?.tasks?.length) return [];

  const tasksById = new Map(artifact.tasks.map((task) => [task.task_id, task]));

  return artifact.tasks.map((task: ScheduleTask) => {
    const predecessorNames = task.predecessor_task_ids
      .map((id) => tasksById.get(id)?.task_name ?? id)
      .filter(Boolean);
    const workerCount = task.crew_count ?? 0;
    const jobType = task.crew_type_name ?? "";

    return {
      id: task.task_id,
      seqNo: task.sequence_no,
      task: task.task_name || "未命名工序",
      workerCount,
      jobType,
      totalCost: 0,
      startTime: task.start_date,
      endTime: task.end_date,
      constructionSituation: task.task_status,
      prerequisiteProcess: task.predecessor_display || predecessorNames.join(", "),
      quantity: 0,
      quantityUnit: "",
      duration: task.duration_days ? `${task.duration_days}天` : "",
      actualWorkDays: task.duration_days ?? 0,
      constructionMethod: "",
      selectedConstructionMethod: "",
      materialCost: 0,
      laborCost: 0,
      criticalPath: task.is_critical_task,
      worker: jobType,
      count: workerCount,
      startDate: task.start_date,
      endDate: task.end_date,
      outlineLevel: task.indent_level,
      isSummaryTask: task.is_summary_task,
    };
  });
}

/**
 * 将工期成本产物转换为成本曲线点，兼容多种后端 option 字段命名。
 */
export function mapTimeCostArtifactToCostCurve(
  artifact?: TimeCostArtifact | null,
): CostCurvePoint[] {
  if (!artifact) return [];

  const optionPoints = artifact.options
    .map((option, index) => {
      const cost = resolveCostValue(option);
      if (cost === null) return null;
      return {
        date: resolveCostLabel(option, index),
        总成本: Number(cost.toFixed(2)),
      };
    })
    .filter((point): point is CostCurvePoint => point !== null);

  if (optionPoints.length > 0) return optionPoints;

  if (Number.isFinite(artifact.minimum_total_cost_cents)) {
    return [
      {
        date: `最优${artifact.optimal_duration_days}天`,
        总成本: Number((artifact.minimum_total_cost_cents / 100).toFixed(2)),
      },
    ];
  }

  return [];
}
