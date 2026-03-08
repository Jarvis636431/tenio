import { useMemo } from "react";
import type { PlanTask } from "@/types/domain/plan";

type ProcessHighlightItem = {
  id: string;
  name: string;
  start: Date | null;
  end: Date | null;
};

export type DailyProcessItem = {
  id: string;
  name: string;
  seqNo?: string | number;
};

export function useDailyProcesses(
  processHighlights: ProcessHighlightItem[],
  planTasks: PlanTask[],
  selectedTimelineDate: Date | null,
): DailyProcessItem[] {
  return useMemo(() => {
    if (!selectedTimelineDate) return [];

    const globalSeqMap = new Map<string, string | number>();
    planTasks.forEach((task, index) => {
      globalSeqMap.set(task.id, task.seqNo ?? index + 1);
    });

    return processHighlights
      .filter((item) => {
        if (!item.start || !item.end) return false;
        const start = new Date(item.start);
        const end = new Date(item.end);
        start.setHours(12, 0, 0, 0);
        end.setHours(12, 0, 0, 0);
        return selectedTimelineDate >= start && selectedTimelineDate <= end;
      })
      .map((item) => ({
        id: item.id,
        name: item.name,
        seqNo: globalSeqMap.get(item.id),
      }));
  }, [planTasks, processHighlights, selectedTimelineDate]);
}
