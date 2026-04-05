import { useEffect, useMemo, useState } from "react";

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
    if (!selectedTimelineDate) return "";
    const y = selectedTimelineDate.getFullYear();
    const m = String(selectedTimelineDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedTimelineDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [selectedTimelineDate]);

  const reportPeriod = useMemo(() => {
    if (!selectedTimelineDate) return { start: "", end: "" };
    const weekStart = new Date(selectedTimelineDate);
    const day = weekStart.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    weekStart.setDate(weekStart.getDate() - diffToMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const fmt = (date: Date) =>
      `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(
        date.getDate(),
      ).padStart(2, "0")}`;
    return { start: fmt(weekStart), end: fmt(weekEnd), startDate: weekStart, endDate: weekEnd };
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
