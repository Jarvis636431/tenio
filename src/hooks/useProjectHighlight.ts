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
    const starts = intervals.map((i) => parseDate(i.start_datetime)).filter(Boolean) as Date[];
    const ends = intervals.map((i) => parseDate(i.end_datetime)).filter(Boolean) as Date[];
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
      calc: wp.calc,
      start: resolvePlannedRange(wp).start,
      end: resolvePlannedRange(wp).end,
    }));
  }, [coreGraph]);

  const tagMap = useMemo(() => ({}) as Record<string, string[]>, []);

  const resolveExpressIds = useMemo(() => {
    return (expressIds: string[] = [], tagIds: string[] = []) => {
      const resolved = new Set<string>();
      expressIds.forEach((id) => {
        if (id) resolved.add(id);
      });
      return Array.from(resolved);
    };
  }, []);

  const resolveHighlightIds = useMemo(() => {
    return (expressIds: string[] = [], tagIds: string[] = []) => {
      const resolved = new Set<string>();
      expressIds.forEach((id) => {
        if (id) resolved.add(id);
      });
      tagIds.forEach((tagId) => {
        if (tagId) resolved.add(tagId);
      });
      return Array.from(resolved);
    };
  }, []);

  const allResolvedIds = useMemo(() => {
    return processHighlights.flatMap((task) =>
      resolveHighlightIds(task.expressIds ?? [], task.tagIds ?? []),
    );
  }, [processHighlights, resolveHighlightIds]);

  const getIdsByDate = useMemo(() => {
    return (date: Date) => {
      const target = new Date(date);
      target.setHours(12, 0, 0, 0);
      const completedSet = new Set<string>();
      const inProgressSet = new Set<string>();
      const upcomingSet = new Set<string>();
      const blockedSet = new Set<string>();
      let withTags = 0;
      let withExpress = 0;

      processHighlights.forEach((task) => {
        if (!task.start || !task.end) return;
        const start = new Date(task.start);
        const end = new Date(task.end);
        start.setHours(12, 0, 0, 0);
        end.setHours(12, 0, 0, 0);

        const resolvedIds = resolveHighlightIds(task.expressIds, task.tagIds);
        if (task.tagIds?.length) withTags += 1;
        if (task.expressIds?.length) withExpress += 1;
        if (!task.calc) {
          // Once we reach the start of a non-calc task, block these ids permanently for later dates.
          if (target >= start) {
            resolvedIds.forEach((id) => blockedSet.add(id));
          }
          return;
        }
        if (target < start) {
          resolvedIds.forEach((id) => {
            if (!blockedSet.has(id)) upcomingSet.add(id);
          });
        } else if (target > end) {
          resolvedIds.forEach((id) => {
            if (!blockedSet.has(id)) completedSet.add(id);
          });
        } else {
          resolvedIds.forEach((id) => {
            if (!blockedSet.has(id)) inProgressSet.add(id);
          });
        }
      });

      if (blockedSet.size > 0) {
        blockedSet.forEach((id) => {
          completedSet.delete(id);
          inProgressSet.delete(id);
          upcomingSet.delete(id);
        });
      }

      if (processHighlights.length > 0) {
        const targetId = "25XjhlxiHEqAJW4TuCxEyF";
        const sample = processHighlights[0];
        console.debug("[highlight] idsByDate summary", {
          date: target.toISOString(),
          completed: completedSet.size,
          inProgress: inProgressSet.size,
          upcoming: upcomingSet.size,
          targetIdStatus: {
            completed: completedSet.has(targetId),
            inProgress: inProgressSet.has(targetId),
            upcoming: upcomingSet.has(targetId),
          },
          sample: sample
            ? {
                id: sample.id,
                name: sample.name,
                calc: sample.calc,
                expressIds: sample.expressIds?.length ?? 0,
                tagIds: sample.tagIds?.length ?? 0,
              }
            : null,
        });
      }

      return {
        completedIds: Array.from(completedSet),
        inProgressIds: Array.from(inProgressSet),
        upcomingIds: Array.from(upcomingSet),
        debug: {
          withTags,
          withExpress,
          completed: completedSet.size,
          inProgress: inProgressSet.size,
          upcoming: upcomingSet.size,
        },
      };
    };
  }, [processHighlights, resolveHighlightIds]);

  return {
    tagMap,
    processHighlights,
    resolveExpressIds,
    resolveHighlightIds,
    allResolvedIds,
    getIdsByDate,
  };
}
