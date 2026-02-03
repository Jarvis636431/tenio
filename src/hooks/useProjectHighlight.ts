import { useMemo } from "react";
import { useProject } from "@/hooks/useProject";
import type { CoreGraphWorkProcess } from "@/types/domain/schedulepro";

export function useProjectHighlight(projectId?: string) {
  const { coreGraphByProjectId } = useProject();
  const coreGraph = projectId ? coreGraphByProjectId[projectId] : undefined;

  const parseDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const resolvePlannedRange = (wp: CoreGraphWorkProcess) => {
    const exec = wp.execution_state;
    if (!exec) return { start: null, end: null };
    const directStart = parseDate(exec.planned_start_datetime);
    const directEnd = parseDate(exec.planned_end_datetime);
    if (directStart && directEnd) {
      return { start: directStart, end: directEnd };
    }
    const intervals = exec.planned_intervals ?? [];
    if (intervals.length === 0) return { start: directStart, end: directEnd };
    const starts = intervals
      .map((i) => parseDate(i.start_datetime))
      .filter(Boolean) as Date[];
    const ends = intervals
      .map((i) => parseDate(i.end_datetime))
      .filter(Boolean) as Date[];
    if (!starts.length || !ends.length) return { start: directStart, end: directEnd };
    return {
      start: new Date(Math.min(...starts.map((d) => d.getTime()))),
      end: new Date(Math.max(...ends.map((d) => d.getTime()))),
    };
  };

  const processHighlights = useMemo(() => {
    const workProcesses = coreGraph?.work_processes ?? [];
    return workProcesses.map((wp: CoreGraphWorkProcess) => ({
      id: wp.id,
      name: wp.name || wp.code || "未命名工序",
      expressIds: wp.express_ids ?? [],
      tagIds: wp.tag ?? [],
      start: resolvePlannedRange(wp).start,
      end: resolvePlannedRange(wp).end,
    }));
  }, [coreGraph]);

  const tagMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    processHighlights.forEach((task) => {
      const tags = task.tagIds ?? [];
      const ids = task.expressIds ?? [];
      tags.forEach((tagId, index) => {
        const expressId = ids[index];
        if (!tagId || !expressId) return;
        if (!map[tagId]) {
          map[tagId] = [];
        }
        map[tagId].push(expressId);
      });
    });
    return map;
  }, [processHighlights]);

  const resolveExpressIds = useMemo(() => {
    return (expressIds: string[] = [], tagIds: string[] = []) => {
      const resolved = new Set<string>();
      expressIds.forEach((id) => {
        if (id) resolved.add(id);
      });
      tagIds.forEach((tagId) => {
        const mapped = tagMap[tagId] ?? [];
        mapped.forEach((id) => {
          if (id) resolved.add(id);
        });
      });
      return Array.from(resolved);
    };
  }, [tagMap]);

  const allResolvedIds = useMemo(() => {
    return processHighlights.flatMap((task) =>
      resolveExpressIds(task.expressIds ?? [], task.tagIds ?? []),
    );
  }, [processHighlights, resolveExpressIds]);

  const getIdsByDate = useMemo(() => {
    return (date: Date) => {
      const completed: string[] = [];
      const inProgress: string[] = [];
      const upcoming: string[] = [];

      processHighlights.forEach((task) => {
        if (!task.start || !task.end) return;
        if (date < task.start) {
          upcoming.push(...resolveExpressIds(task.expressIds, task.tagIds));
        } else if (date > task.end) {
          completed.push(...resolveExpressIds(task.expressIds, task.tagIds));
        } else {
          inProgress.push(...resolveExpressIds(task.expressIds, task.tagIds));
        }
      });

      return {
        completedIds: completed,
        inProgressIds: inProgress,
        upcomingIds: upcoming,
      };
    };
  }, [processHighlights, resolveExpressIds]);

  return {
    tagMap,
    processHighlights,
    resolveExpressIds,
    allResolvedIds,
    getIdsByDate,
  };
}
