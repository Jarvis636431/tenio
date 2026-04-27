import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useProject, projectQueryKeys } from "@/features/project";
import { getLatestScheduleArtifact, getLatestTimeCostArtifact } from "../services/project-api";
import type { TimeCostArtifact } from "../types";

interface UseProjectDataOptions {
  projectId?: string;
}

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

function mapTimeCostArtifactToCostCurve(artifact?: TimeCostArtifact | null): CostCurvePoint[] {
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

export function useProjectData({ projectId: propsProjectId }: UseProjectDataOptions = {}) {
  const { id: paramProjectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, projects } = useProject();

  const projectRef = propsProjectId || paramProjectId || currentProject?.project_id || "";
  const matchedProject = useMemo(
    () => projects.find((project) => project.project_id === projectRef),
    [projects, projectRef],
  );
  const resolvedProjectId = matchedProject?.project_id ?? projectRef;

  useEffect(() => {
    if (paramProjectId && matchedProject && paramProjectId !== matchedProject.project_id) {
      navigate(`/project/${matchedProject.project_id}`, { replace: true });
    }
  }, [paramProjectId, matchedProject, navigate]);

  const scheduleQuery = useQuery({
    queryKey: resolvedProjectId
      ? projectQueryKeys.scheduleArtifact(resolvedProjectId)
      : ["project", "artifact", "schedule", "empty"],
    queryFn: async () => {
      if (!resolvedProjectId) {
        throw new Error("缺少项目 ID");
      }
      return getLatestScheduleArtifact(resolvedProjectId);
    },
    enabled: Boolean(resolvedProjectId),
    refetchOnWindowFocus: false,
  });

  const scheduleArtifact = scheduleQuery.data;
  const isLoadingGraph = scheduleQuery.isLoading;
  const planTasks = useMemo(() => scheduleArtifact?.tasks ?? [], [scheduleArtifact]);

  // ===== useOverviewMetrics 逻辑 =====
  const currentProjectName = useMemo(() => {
    if (!projectRef && !resolvedProjectId) {
      return currentProject?.project_name || "项目详情";
    }
    const project =
      matchedProject ?? projects.find((item) => item.project_id === resolvedProjectId);
    return project?.project_name || currentProject?.project_name || "项目详情";
  }, [projectRef, resolvedProjectId, matchedProject, projects, currentProject]);

  const totalDurationLabel = useMemo(() => {
    if (scheduleArtifact?.total_duration_days) return `${scheduleArtifact.total_duration_days}天`;
    return "";
  }, [scheduleArtifact]);

  const costQuery = useQuery({
    queryKey: resolvedProjectId
      ? projectQueryKeys.timeCostArtifact(resolvedProjectId)
      : ["project", "artifact", "time-cost", "empty"],
    queryFn: async () => {
      if (!resolvedProjectId) {
        throw new Error("缺少项目 ID");
      }
      return getLatestTimeCostArtifact(resolvedProjectId);
    },
    enabled: Boolean(resolvedProjectId),
    refetchOnWindowFocus: false,
  });

  const costCurveChart = useMemo(() => {
    const points = mapTimeCostArtifactToCostCurve(costQuery.data);
    const totalCosts = points.map((point) => point.总成本);
    const numericCosts = totalCosts
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    const maxAbsCost = numericCosts.length
      ? Math.max(...numericCosts.map((value) => Math.abs(value)))
      : 0;
    const unitMeta =
      maxAbsCost >= 1e8
        ? { divisor: 1e8, unit: "亿" }
        : maxAbsCost >= 1e4
          ? { divisor: 1e4, unit: "万" }
          : { divisor: 1, unit: "元" };
    return {
      unit: unitMeta.unit,
      points: points.map((point) => {
        const rawCost = Number(point.总成本);
        const normalized = Number.isFinite(rawCost) ? rawCost / unitMeta.divisor : 0;
        return {
          date: point.date,
          总成本: Number(normalized.toFixed(2)),
        };
      }),
    };
  }, [costQuery.data]);

  return {
    resolvedProjectId,
    scheduleArtifact,
    isLoadingGraph,
    planTasks,
    currentProjectName,
    totalDurationLabel,
    costQuery: {
      ...costQuery,
      chartData: costCurveChart,
    },
  };
}
