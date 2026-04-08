import { useCallback, useMemo } from "react";
import { useProject } from "./useProject";
import { toDate } from "@/lib/date";
import type { CoreGraphWorkProcess } from "@/types/domain/schedulepro";

export function useProjectHighlight(projectId?: string) {
  const { coreGraphByProjectId } = useProject();
  const coreGraph = projectId ? coreGraphByProjectId[projectId] : undefined;

  const resolvePlannedRange = useCallback((wp: CoreGraphWorkProcess) => {
    const exec = wp.execution_state;
    if (!exec) return { start: null, end: null };
    const directStart = toDate(exec.planned_start_datetime);
    const directEnd = toDate(exec.planned_end_datetime);
    if (directStart && directEnd) {
      return { start: directStart, end: directEnd };
    }
    const intervals = exec.planned_intervals ?? [];
    if (intervals.length === 0) return { start: directStart, end: directEnd };
    const starts = intervals.map((i) => toDate(i.start_datetime)).filter(Boolean) as Date[];
    const ends = intervals.map((i) => toDate(i.end_datetime)).filter(Boolean) as Date[];
    if (!starts.length || !ends.length) return { start: directStart, end: directEnd };
    return {
      start: new Date(Math.min(...starts.map((d) => d.getTime()))),
      end: new Date(Math.max(...ends.map((d) => d.getTime()))),
    };
  }, []);

  const processHighlights = useMemo(() => {
    const workProcesses = coreGraph?.work_processes ?? [];
    return workProcesses.map((wp: CoreGraphWorkProcess) => ({
      id: wp.id,
      name: wp.name || wp.code || "未命名工序",
      expressIds: wp.express_ids ?? [],
      tagIds: wp.tag ?? [],
      calc: wp.calc,
      start: resolvePlannedRange(wp).start,
      end: resolvePlannedRange(wp).end,
    }));
  }, [coreGraph, resolvePlannedRange]);

  const tagMap = useMemo(() => ({}) as Record<string, string[]>, []);

  const resolveHighlightIds = useCallback((expressIds: string[] = [], tagIds: string[] = []) => {
    const resolved = new Set<string>();
    expressIds.forEach((id) => {
      if (id) resolved.add(id);
    });
    tagIds.forEach((tagId) => {
      if (tagId) resolved.add(tagId);
    });
    return Array.from(resolved);
  }, []);

  const getIdsByDate = useMemo(() => {
    return (date: Date) => {
      const target = new Date(date);
      target.setHours(12, 0, 0, 0);
      const completedSet = new Set<string>();
      const inProgressSet = new Set<string>();
      const blockedSet = new Set<string>();

      processHighlights.forEach((task) => {
        if (!task.start || !task.end) return;
        const start = new Date(task.start);
        const end = new Date(task.end);
        start.setHours(12, 0, 0, 0);
        end.setHours(12, 0, 0, 0);

        const resolvedIds = resolveHighlightIds(task.expressIds, task.tagIds);
        if (!task.calc) {
          if (target >= start) {
            resolvedIds.forEach((id) => blockedSet.add(id));
          }
          return;
        }
        if (target > end) {
          resolvedIds.forEach((id) => {
            if (!blockedSet.has(id)) completedSet.add(id);
          });
        } else if (target >= start) {
          resolvedIds.forEach((id) => {
            if (!blockedSet.has(id)) inProgressSet.add(id);
          });
        }
      });

      if (blockedSet.size > 0) {
        blockedSet.forEach((id) => {
          completedSet.delete(id);
          inProgressSet.delete(id);
        });
      }

      return {
        completedIds: Array.from(completedSet),
        inProgressIds: Array.from(inProgressSet),
      };
    };
  }, [processHighlights, resolveHighlightIds]);

  return {
    tagMap,
    processHighlights,
    getIdsByDate,
  };
}
