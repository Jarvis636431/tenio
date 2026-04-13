import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useProject, getProjectCoreGraph, projectQueryKeys } from "@/features/project";
import type { PlanTask } from "@/types/domain/plan";
import type { CoreGraphResponse } from "@/types/domain/schedulepro";

interface UseProjectDataOptions {
  projectId?: string;
}

function resolvePlannedRange(wp: NonNullable<CoreGraphResponse["work_processes"]>[number]) {
  const exec = wp.execution_state;
  if (!exec) return { start: "", end: "" };
  const start = exec.planned_start_datetime ?? "";
  const end = exec.planned_end_datetime ?? "";
  if (start && end) return { start, end };
  const intervals = exec.planned_intervals ?? [];
  if (intervals.length === 0) return { start, end };
  const starts = intervals
    .map((item) => new Date(item.start_datetime).getTime())
    .filter((value) => !Number.isNaN(value));
  const ends = intervals
    .map((item) => new Date(item.end_datetime).getTime())
    .filter((value) => !Number.isNaN(value));
  if (!starts.length || !ends.length) return { start, end };
  return {
    start: new Date(Math.min(...starts)).toISOString(),
    end: new Date(Math.max(...ends)).toISOString(),
  };
}

export function useProjectData({ projectId: propsProjectId }: UseProjectDataOptions = {}) {
  const { id: paramProjectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, projects } = useProject();

  const projectRef = propsProjectId || paramProjectId || currentProject?.id || "";
  const matchedProject = useMemo(
    () => projects.find((project) => project.id === projectRef),
    [projects, projectRef],
  );
  const resolvedProjectId = matchedProject?.id ?? projectRef;

  useEffect(() => {
    if (paramProjectId && matchedProject && paramProjectId !== matchedProject.id) {
      navigate(`/project/${matchedProject.id}`, { replace: true });
    }
  }, [paramProjectId, matchedProject, navigate]);

  const coreGraphQuery = useQuery({
    queryKey: resolvedProjectId
      ? projectQueryKeys.coreGraph(resolvedProjectId)
      : ["project", "core-graph", "empty"],
    queryFn: async () => {
      if (!resolvedProjectId) {
        throw new Error("缺少项目 ID");
      }
      return getProjectCoreGraph(resolvedProjectId);
    },
    enabled: Boolean(resolvedProjectId),
    refetchOnWindowFocus: false,
  });

  const coreGraph = coreGraphQuery.data;
  const isLoadingGraph = coreGraphQuery.isLoading;

  // ===== usePlanTasks 逻辑 =====
  const planTasks = useMemo<PlanTask[]>(() => {
    if (!coreGraph?.work_processes?.length) return [];

    const depsByTarget = new Map<string, string[]>();
    coreGraph.dependencies?.forEach((dep) => {
      const toId = dep.to_work_process_id ?? dep.successor_id;
      const fromId = dep.from_work_process_id ?? dep.predecessor_id;
      if (!toId || !fromId) return;
      const list = depsByTarget.get(toId) ?? [];
      list.push(fromId);
      depsByTarget.set(toId, list);
    });

    return coreGraph.work_processes.map((wp) => {
      const exec = wp.execution_state;
      const { start, end } = resolvePlannedRange(wp);
      const workerCount = wp.team_size ?? wp.suggested_team_count ?? 0;
      const jobType = wp.trade?.name ?? "";
      return {
        id: wp.id,
        seqNo: wp.seq_no,
        task: wp.name || wp.code || "未命名工序",
        workerCount,
        jobType,
        totalCost: (wp.labor_cost ?? 0) + (wp.material_cost ?? 0) + (wp.device_rental_cost ?? 0),
        startTime: start,
        endTime: end,
        constructionSituation: exec?.status ?? "",
        prerequisiteProcess: (depsByTarget.get(wp.id) ?? []).join(", "),
        quantity: wp.quantity ?? 0,
        quantityUnit: wp.unit ?? "",
        duration: wp.duration_days ? `${wp.duration_days}天` : "",
        actualWorkDays: wp.duration_days ?? 0,
        constructionMethod: wp.selected_method?.name ?? "",
        selectedConstructionMethod: wp.selected_method?.name ?? "",
        materialCost: wp.material_cost ?? 0,
        laborCost: wp.labor_cost ?? 0,
        criticalPath: exec?.critical_path ?? false,
        worker: jobType,
        count: workerCount,
        startDate: start,
        endDate: end,
      } as PlanTask;
    });
  }, [coreGraph]);

  // ===== useOverviewMetrics 逻辑 =====
  const currentProjectName = useMemo(() => {
    if (!projectRef && !resolvedProjectId) {
      return currentProject?.name || "项目详情";
    }
    const project = matchedProject ?? projects.find((item) => item.id === resolvedProjectId);
    return project?.name || currentProject?.name || "项目详情";
  }, [projectRef, resolvedProjectId, matchedProject, projects, currentProject]);

  const totalDurationLabel = useMemo(() => {
    if (!coreGraph?.work_processes.length) return "";
    const times = coreGraph.work_processes
      .map((wp) => ({
        start: wp.execution_state?.planned_start_datetime,
        end: wp.execution_state?.planned_end_datetime,
      }))
      .filter((t): t is { start: string; end: string } => Boolean(t.start && t.end));
    if (!times.length) return "";
    const starts = times.map((t) => new Date(t.start).getTime()).filter((v) => !Number.isNaN(v));
    const ends = times.map((t) => new Date(t.end).getTime()).filter((v) => !Number.isNaN(v));
    if (!starts.length || !ends.length) return "";
    const minStart = Math.min(...starts);
    const maxEnd = Math.max(...ends);
    const totalDays = Math.max(1, Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24)) + 1);
    return `${totalDays}天`;
  }, [coreGraph]);

  return {
    resolvedProjectId,
    coreGraph,
    isLoadingGraph,
    planTasks,
    currentProjectName,
    totalDurationLabel,
  };
}
