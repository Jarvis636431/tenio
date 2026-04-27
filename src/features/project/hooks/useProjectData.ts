import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useProject, projectQueryKeys } from "@/features/project";
import { getLatestScheduleArtifact, getLatestTimeCostArtifact } from "../services/project-api";
import {
  mapScheduleArtifactToPlanTasks,
  mapTimeCostArtifactToCostCurve,
} from "../services/overview-artifact-mapper";

interface UseProjectDataOptions {
  projectId?: string;
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
  const planTasks = useMemo(
    () => mapScheduleArtifactToPlanTasks(scheduleArtifact),
    [scheduleArtifact],
  );

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
