import { useMemo } from "react";
import type { Project } from "@/types/domain/project";
import type { CoreGraphResponse } from "@/types/domain/schedulepro";

interface UseOverviewMetricsOptions {
  requestedProjectRef: string;
  resolvedProjectId: string;
  projects: Project[];
  currentProject?: Project | null;
  coreGraph?: CoreGraphResponse;
}

interface UseOverviewMetricsResult {
  currentProjectName: string;
  totalDurationLabel: string;
  onsiteCount: number | undefined;
}

export function useOverviewMetrics({
  requestedProjectRef,
  resolvedProjectId,
  projects,
  currentProject,
  coreGraph,
}: UseOverviewMetricsOptions): UseOverviewMetricsResult {
  const currentProjectName = useMemo(() => {
    if (!requestedProjectRef && !resolvedProjectId) {
      return currentProject?.name || "项目详情";
    }
    const matchedProject = projects.find((project) => project.id === resolvedProjectId);
    return matchedProject?.name || currentProject?.name || "项目详情";
  }, [requestedProjectRef, resolvedProjectId, projects, currentProject]);

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

  const onsiteCount = useMemo(() => {
    if (!coreGraph?.work_processes.length) return undefined;
    const now = Date.now();
    const activeWorkProcesses = coreGraph.work_processes.filter((wp) => {
      const start = wp.execution_state?.planned_start_datetime
        ? new Date(wp.execution_state.planned_start_datetime).getTime()
        : NaN;
      const end = wp.execution_state?.planned_end_datetime
        ? new Date(wp.execution_state.planned_end_datetime).getTime()
        : NaN;
      if (Number.isNaN(start) || Number.isNaN(end)) return false;
      return now >= start && now <= end;
    });
    if (!activeWorkProcesses.length) return 0;
    return activeWorkProcesses.reduce(
      (sum, wp) => sum + (wp.team_size ?? wp.suggested_team_count ?? 0),
      0,
    );
  }, [coreGraph]);

  return {
    currentProjectName,
    totalDurationLabel,
    onsiteCount,
  };
}
