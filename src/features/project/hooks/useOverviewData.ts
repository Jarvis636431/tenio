import { useEffect, useMemo, useState } from "react";
import { useProject } from "./useProject";
import { formatDate, getWeekRange, toDate } from "@/lib/date";
import { sortBySeqNo } from "@/lib/array";
import type { PlanTask } from "@/types/domain/plan";
import type { CoreGraphWorkProcess } from "@/types/domain/schedulepro";

interface UseOverviewDataOptions {
  projectId: string | null | undefined;
  planTasks: PlanTask[];
}

interface ProcessHighlight {
  id: string;
  name: string;
  start: Date | null;
  end: Date | null;
}

interface TimeRange {
  startDay: number;
  endDay: number;
  totalDays: number;
  baseDate: Date;
}

interface DailyProcessItem {
  id: string;
  name: string;
  seqNo?: string | number;
}

export function useOverviewData({ projectId, planTasks }: UseOverviewDataOptions) {
  const { coreGraphByProjectId } = useProject();
  const coreGraph = projectId ? coreGraphByProjectId[projectId] : undefined;

  // ===== useProjectHighlight 逻辑 =====
  const processHighlights = useMemo<ProcessHighlight[]>(() => {
    const workProcesses = coreGraph?.work_processes ?? [];
    return workProcesses.map((wp: CoreGraphWorkProcess) => {
      const exec = wp.execution_state;
      let start: Date | null = null;
      let end: Date | null = null;

      if (exec) {
        start = toDate(exec.planned_start_datetime);
        end = toDate(exec.planned_end_datetime);

        if ((!start || !end) && exec.planned_intervals?.length) {
          const intervals = exec.planned_intervals;
          const starts = intervals.map((i) => toDate(i.start_datetime)).filter(Boolean) as Date[];
          const ends = intervals.map((i) => toDate(i.end_datetime)).filter(Boolean) as Date[];
          if (starts.length && ends.length) {
            start = new Date(Math.min(...starts.map((d) => d.getTime())));
            end = new Date(Math.max(...ends.map((d) => d.getTime())));
          }
        }
      }

      return {
        id: wp.id,
        name: wp.name || wp.code || "未命名工序",
        start,
        end,
      };
    });
  }, [coreGraph]);

  // ===== useOverviewTimeline 逻辑 =====
  const [currentDay, setCurrentDay] = useState(1);
  const [playbackRate, setPlaybackRate] = useState<1 | 2 | 4>(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const timeRange = useMemo<TimeRange | null>(() => {
    if (!processHighlights.length) return null;
    const starts = processHighlights.map((t) => t.start).filter(Boolean) as Date[];
    const ends = processHighlights.map((t) => t.end).filter(Boolean) as Date[];
    if (!starts.length || !ends.length) return null;
    const minStart = new Date(Math.min(...starts.map((d) => d.getTime())));
    const maxEnd = new Date(Math.max(...ends.map((d) => d.getTime())));
    const totalDays = Math.max(
      1,
      Math.ceil((maxEnd.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );
    return { startDay: 1, endDay: totalDays, totalDays, baseDate: minStart };
  }, [processHighlights]);

  const selectedTimelineDate = useMemo<Date | null>(() => {
    if (!timeRange) return null;
    const selected = new Date(timeRange.baseDate);
    selected.setDate(timeRange.baseDate.getDate() + currentDay - 1);
    selected.setHours(12, 0, 0, 0);
    return selected;
  }, [currentDay, timeRange]);

  const selectedTimelineDateLabel = useMemo(() => {
    return formatDate(selectedTimelineDate, "yyyy-mm-dd");
  }, [selectedTimelineDate]);

  const reportPeriod = useMemo(() => {
    if (!selectedTimelineDate)
      return { start: "", end: "", startDate: undefined, endDate: undefined };
    const { monday, sunday } = getWeekRange(selectedTimelineDate);
    return {
      start: formatDate(monday, "yyyy/mm/dd"),
      end: formatDate(sunday, "yyyy/mm/dd"),
      startDate: monday,
      endDate: sunday,
    };
  }, [selectedTimelineDate]);

  const timelineProgress = useMemo(() => {
    if (!timeRange) return 0;
    const span = Math.max(1, timeRange.endDay - timeRange.startDay);
    return Math.round(((currentDay - timeRange.startDay) / span) * 100);
  }, [currentDay, timeRange]);

  useEffect(() => {
    if (timeRange && currentDay === 1) {
      setCurrentDay(timeRange.startDay);
    }
  }, [currentDay, timeRange]);

  useEffect(() => {
    if (!isPlaying || !timeRange) return;

    const intervalByRate: Record<1 | 2 | 4, number> = {
      1: 1000,
      2: 500,
      4: 250,
    };

    const timer = window.setInterval(() => {
      setCurrentDay((prev) => {
        if (prev >= timeRange.endDay) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalByRate[playbackRate]);

    return () => window.clearInterval(timer);
  }, [isPlaying, playbackRate, timeRange]);

  // ===== useDailyProcesses 逻辑 =====
  const dailyProcesses = useMemo<DailyProcessItem[]>(() => {
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

  // ===== 计算导出所需数据 =====
  const dailyTaskNames = useMemo(
    () => sortBySeqNo(dailyProcesses).map((item) => item.name),
    [dailyProcesses],
  );

  const weeklyTaskNames = useMemo(() => {
    const { startDate, endDate } = reportPeriod;
    if (!startDate || !endDate) return [];
    return sortBySeqNo(
      planTasks.filter((task) => {
        if (!task.startTime || !task.endTime) return false;
        const start = new Date(task.startTime);
        const end = new Date(task.endTime);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
        return end >= startDate && start <= endDate;
      }),
    ).map((task) => task.task);
  }, [planTasks, reportPeriod]);

  return {
    // 时间轴数据
    currentDay,
    setCurrentDay,
    playbackRate,
    setPlaybackRate,
    isPlaying,
    setIsPlaying,
    timeRange,
    selectedTimelineDate,
    selectedTimelineDateLabel,
    timelineProgress,
    reportPeriod,
    // 工序数据
    processHighlights,
    dailyProcesses,
    dailyTaskNames,
    weeklyTaskNames,
  };
}
