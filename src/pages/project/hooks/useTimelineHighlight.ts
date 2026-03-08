import { useMemo } from "react";

interface TimelineHighlightResult {
  completedIds: string[];
  inProgressIds: string[];
}

export function useTimelineHighlight(
  selectedTimelineDate: Date | null,
  getIdsByDate: (date: Date) => {
    completedIds: string[];
    inProgressIds: string[];
  },
): TimelineHighlightResult {
  return useMemo(() => {
    if (!selectedTimelineDate) {
      return { completedIds: [], inProgressIds: [] };
    }
    const result = getIdsByDate(selectedTimelineDate);
    return {
      completedIds: result.completedIds,
      inProgressIds: result.inProgressIds,
    };
  }, [getIdsByDate, selectedTimelineDate]);
}
