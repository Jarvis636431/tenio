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

  const resolveHighlightIds = useMemo(() => {
    return (expressIds: string[] = [], tagIds: string[] = []) => {
      const resolved = new Set<string>();
      expressIds.forEach((id) => {
        if (id) resolved.add(id);
      });
      tagIds.forEach((tagId) => {
        if (tagId) resolved.add(tagId);
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
      resolveHighlightIds(task.expressIds ?? [], task.tagIds ?? []),
    );
  }, [processHighlights, resolveHighlightIds]);

  if (processHighlights.length === 0 && coreGraph?.work_processes?.length) {
    console.debug("[highlight] no processHighlights mapped", {
      workProcessCount: coreGraph.work_processes.length,
    });
  }

  if (processHighlights.length > 0) {
    console.debug("[highlight] mapped highlights", {
      count: processHighlights.length,
      withExpress: processHighlights.filter((t) => t.expressIds.length > 0)
        .length,
      withTag: processHighlights.filter((t) => t.tagIds.length > 0).length,
    });
  }

  const getIdsByDate = useMemo(() => {
    return (date: Date) => {
      if (processHighlights.length > 0) {
        console.debug("[highlight] getIdsByDate", {
          date: date.toISOString(),
          sample: processHighlights[0]
            ? {
                id: processHighlights[0].id,
                name: processHighlights[0].name,
                start: processHighlights[0].start?.toISOString?.() ?? null,
                end: processHighlights[0].end?.toISOString?.() ?? null,
                expressIds: processHighlights[0].expressIds?.length ?? 0,
                tagIds: processHighlights[0].tagIds?.length ?? 0,
              }
            : null,
        });
      }
      const target = new Date(date);
      target.setHours(12, 0, 0, 0);
      const completed: string[] = [];
      const inProgress: string[] = [];
      const upcoming: string[] = [];

      processHighlights.forEach((task) => {
        if (!task.start || !task.end) return;
        const start = new Date(task.start);
        const end = new Date(task.end);
        start.setHours(12, 0, 0, 0);
        end.setHours(12, 0, 0, 0);

        if (target < start) {
          upcoming.push(...resolveHighlightIds(task.expressIds, task.tagIds));
        } else if (target > end) {
          completed.push(...resolveHighlightIds(task.expressIds, task.tagIds));
        } else {
          inProgress.push(...resolveHighlightIds(task.expressIds, task.tagIds));
        }
      });

      return {
        completedIds: completed,
        inProgressIds: inProgress,
        upcomingIds: upcoming,
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
