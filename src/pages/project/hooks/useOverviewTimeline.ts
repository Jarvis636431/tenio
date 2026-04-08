import { useEffect, useMemo, useState } from "react";
import { formatDate, getWeekRange } from "@/lib/date";

type ProcessHighlight = {
  start?: Date | null;
  end?: Date | null;
};

type TimeRange = {
  startDay: number;
  endDay: number;
  totalDays: number;
  baseDate: Date;
};

interface UseOverviewTimelineResult {
  currentDay: number;
  setCurrentDay: React.Dispatch<React.SetStateAction<number>>;
  playbackRate: 1 | 2 | 4;
  setPlaybackRate: React.Dispatch<React.SetStateAction<1 | 2 | 4>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  timeRange: TimeRange | null;
  selectedTimelineDate: Date | null;
  selectedTimelineDateLabel: string;
  timelineProgress: number;
  reportPeriod: {
    start: string;
    end: string;
    startDate?: Date;
    endDate?: Date;
  };
}

export function useOverviewTimeline(
  processHighlights: ProcessHighlight[],
): UseOverviewTimelineResult {
  const [currentDay, setCurrentDay] = useState(1);
  const [playbackRate, setPlaybackRate] = useState<1 | 2 | 4>(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const timeRange = useMemo(() => {
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

  const selectedTimelineDate = useMemo(() => {
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
    if (!selectedTimelineDate) return { start: "", end: "" };
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

  return {
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
  };
}
