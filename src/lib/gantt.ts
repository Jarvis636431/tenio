export type TimelineScale = "day" | "hour" | "week" | "month";

const MS_IN_HOUR = 1000 * 60 * 60;
const MS_IN_DAY = MS_IN_HOUR * 24;
const MS_IN_WEEK = MS_IN_DAY * 7;

export const alignDateToScaleStart = (date: Date, scale: TimelineScale) => {
  const aligned = new Date(date.getTime());
  if (scale === "month") {
    aligned.setDate(1);
    aligned.setHours(0, 0, 0, 0);
  } else if (scale === "week") {
    return getWeekStart(aligned);
  } else if (scale === "day") {
    aligned.setHours(0, 0, 0, 0);
  } else {
    aligned.setMinutes(0, 0, 0);
  }
  return aligned;
};

const addUnits = (date: Date, units: number, scale: TimelineScale) => {
  const next = new Date(date.getTime());
  if (scale === "month") {
    next.setMonth(next.getMonth() + units);
  } else if (scale === "week") {
    next.setDate(next.getDate() + units * 7);
  } else if (scale === "day") {
    next.setDate(next.getDate() + units);
  } else {
    next.setHours(next.getHours() + units);
  }
  return next;
};

const monthDiff = (start: Date, end: Date) => {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
};

export const getWeekStart = (date: Date) => {
  const weekStart = new Date(date.getTime());
  const dayOfWeek = weekStart.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(weekStart.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

export const calculateTotalUnits = (startAnchor: Date, maxTime: number, scale: TimelineScale) => {
  if (scale === "month") {
    const endDate = alignDateToScaleStart(new Date(maxTime), "month");
    const diff = monthDiff(startAnchor, endDate);
    return Math.max(1, diff + 1);
  }
  if (scale === "week") {
    const step = MS_IN_WEEK;
    const diff = Math.max(0, maxTime - startAnchor.getTime());
    return Math.max(1, Math.ceil(diff / step) + 1);
  }
  const step = scale === "day" ? MS_IN_DAY : MS_IN_HOUR;
  const diff = Math.max(0, maxTime - startAnchor.getTime());
  return Math.max(1, Math.ceil(diff / step) + 1);
};

export const calculateStartOffset = (start: Date, startAnchor: Date, scale: TimelineScale) => {
  if (scale === "month") {
    const alignedStart = alignDateToScaleStart(start, "month");
    return Math.max(0, monthDiff(startAnchor, alignedStart));
  }
  if (scale === "week") {
    const step = MS_IN_WEEK;
    const diff = start.getTime() - startAnchor.getTime();
    return Math.max(0, Math.floor(diff / step));
  }
  const step = scale === "day" ? MS_IN_DAY : MS_IN_HOUR;
  const diff = start.getTime() - startAnchor.getTime();
  return Math.max(0, Math.floor(diff / step));
};

export const calculateSpanUnits = (start: Date, end: Date, scale: TimelineScale) => {
  if (scale === "month") {
    const startAligned = alignDateToScaleStart(start, "month");
    const endAligned = alignDateToScaleStart(end, "month");
    const diff = monthDiff(startAligned, endAligned);
    return Math.max(1, diff + 1);
  }

  const diff = end.getTime() - start.getTime();
  if (scale === "week") {
    const units = Math.ceil(diff / MS_IN_WEEK) + 1;
    return Math.max(1, units);
  }

  if (scale === "day") {
    const units = Math.ceil(diff / MS_IN_DAY) + 1;
    return Math.max(1, units);
  }

  const units = Math.ceil(Math.max(diff, 0) / MS_IN_HOUR);
  return Math.max(1, units || 1);
};

export interface TimelineHeader {
  key: number;
  primary: string;
  secondary?: string;
  isWeekend?: boolean;
}

export const generateHeaders = (
  startAnchor: Date,
  totalUnits: number,
  scale: TimelineScale,
): TimelineHeader[] => {
  return Array.from({ length: totalUnits }, (_, index) => {
    const current = addUnits(startAnchor, index, scale);

    if (scale === "month") {
      return {
        key: index,
        primary: `${current.getFullYear()}/${current.getMonth() + 1}`,
      };
    }

    if (scale === "week") {
      const weekEnd = new Date(current);
      weekEnd.setDate(current.getDate() + 6);
      return {
        key: index,
        primary: `第${index + 1}周`,
        secondary: `${current.getMonth() + 1}/${current.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`,
      };
    }

    if (scale === "day") {
      const dayOfWeek = current.getDay();
      return {
        key: index,
        primary: `${current.getMonth() + 1}/${current.getDate()}`,
        secondary: ["日", "一", "二", "三", "四", "五", "六"][dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      };
    }

    const dayOfWeek = current.getDay();
    return {
      key: index,
      primary: `${current.getHours().toString().padStart(2, "0")}:00`,
      secondary: `${current.getMonth() + 1}/${current.getDate()}`,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    };
  });
};

/** 工种 Badge 样式映射 */
export const WORKER_BADGE_CLASSES: Record<string, string> = {
  钢筋工:
    "bg-category-blue-100 text-category-blue-800 border-category-blue-200 hover:bg-category-blue-100 hover:text-category-blue-800",
  混凝土工:
    "bg-category-orange-100 text-category-orange-800 border-category-orange-200 hover:bg-category-orange-100 hover:text-category-orange-800",
  木工: "bg-category-yellow-100 text-category-yellow-800 border-category-yellow-200 hover:bg-category-yellow-100 hover:text-category-yellow-800",
  测量员:
    "bg-category-purple-100 text-category-purple-800 border-category-purple-200 hover:bg-category-purple-100 hover:text-category-purple-800",
  土方工:
    "bg-category-orange-100 text-category-orange-800 border-category-orange-200 hover:bg-category-orange-100 hover:text-category-orange-800",
  砌筑工:
    "bg-category-green-100 text-category-green-800 border-category-green-200 hover:bg-category-green-100 hover:text-category-green-800",
  抹灰工:
    "bg-category-purple-100 text-category-purple-800 border-category-purple-200 hover:bg-category-purple-100 hover:text-category-purple-800",
  防水工:
    "bg-category-blue-100 text-category-blue-800 border-category-blue-200 hover:bg-category-blue-100 hover:text-category-blue-800",
  水电工:
    "bg-category-green-100 text-category-green-800 border-category-green-200 hover:bg-category-green-100 hover:text-category-green-800",
  油漆工:
    "bg-category-yellow-100 text-category-yellow-800 border-category-yellow-200 hover:bg-category-yellow-100 hover:text-category-yellow-800",
  油工: "bg-category-yellow-100 text-category-yellow-800 border-category-yellow-200 hover:bg-category-yellow-100 hover:text-category-yellow-800",
  瓦工: "bg-category-red-100 text-category-red-800 border-category-red-200 hover:bg-category-red-100 hover:text-category-red-800",
  不限: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 hover:text-gray-800",
  default: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 hover:text-gray-800",
};

export const getWorkerBadgeClass = (worker: string): string => {
  return WORKER_BADGE_CLASSES[worker] ?? WORKER_BADGE_CLASSES.default;
};

export const COLUMN_WIDTH_MAP: Record<TimelineScale, number> = {
  day: 44,
  hour: 32,
  week: 60,
  month: 72,
};

export const UNIT_LABELS: Record<TimelineScale, string> = {
  day: "天",
  hour: "小时",
  week: "周",
  month: "月",
};

export const ROW_HEIGHT = 28;
