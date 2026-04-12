import { useMemo, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@/components/ui/badge";
import { parseDate } from "@/lib/date";
import { formatWorkerCount, isLagTask } from "@/lib/task";
import type { PlanTask, TimelineScale } from "@/types/domain/plan";

interface GanttChartProps {
  data: PlanTask[];
  scale?: TimelineScale;
}

const MS_IN_HOUR = 1000 * 60 * 60;

const getBaselineDate = () => {
  const baseline = new Date(2025, 0, 1);
  baseline.setHours(0, 0, 0, 0);
  return baseline;
};
const MS_IN_DAY = MS_IN_HOUR * 24;
const MS_IN_WEEK = MS_IN_DAY * 7;

const COLUMN_WIDTH_MAP: Record<TimelineScale, number> = {
  day: 44,
  hour: 32,
  week: 60,
  month: 72,
};

const UNIT_LABELS: Record<TimelineScale, string> = {
  day: "天",
  hour: "小时",
  week: "周",
  month: "月",
};

const alignDateToScaleStart = (date: Date, scale: TimelineScale) => {
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

const getWeekStart = (date: Date) => {
  const weekStart = new Date(date.getTime());
  const dayOfWeek = weekStart.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 周日为0，需要调整为6天前
  weekStart.setDate(weekStart.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const calculateTotalUnits = (startAnchor: Date, maxTime: number, scale: TimelineScale) => {
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

const calculateStartOffset = (start: Date, startAnchor: Date, scale: TimelineScale) => {
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

const calculateSpanUnits = (start: Date, end: Date, scale: TimelineScale) => {
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

  // hour scale
  const units = Math.ceil(Math.max(diff, 0) / MS_IN_HOUR);
  return Math.max(1, units || 1);
};

interface TimelineHeader {
  key: number;
  primary: string;
  secondary?: string;
  isWeekend?: boolean;
}

type TimelineRow = PlanTask & {
  startOffset: number;
  spanUnits: number;
  barLabel: string;
  color: string;
};

const generateHeaders = (
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

const getWorkerBadgeClass = (worker: string): string => {
  const badgeClasses: {
    [key: string]: string;
  } = {
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
  };
  return (
    badgeClasses[worker] ||
    "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 hover:text-gray-800"
  );
};

export function GanttChart({ data, scale = "day" }: GanttChartProps) {
  const chartContentRef = useRef<HTMLDivElement>(null);

  const ROW_HEIGHT = 28; // h-7
  const timelineScale = scale;
  const columnWidth = COLUMN_WIDTH_MAP[timelineScale];
  const filteredData = useMemo(() => data.filter((task) => !isLagTask(task.task)), [data]);

  const { timelineData, totalUnits, headers } = useMemo(() => {
    const baseline = getBaselineDate();
    const parsedItems = filteredData.map((item) => {
      const start = item.startDate ? parseDate(item.startDate) : null;
      const end = item.endDate ? parseDate(item.endDate) : null;
      return { item, start, end };
    });

    const timePoints = parsedItems.flatMap(({ start, end }) => {
      const points: number[] = [];
      if (start) points.push(start.getTime());
      if (end) points.push(end.getTime());
      return points;
    });

    if (timePoints.length === 0) {
      timePoints.push(baseline.getTime());
    }

    const minTime = Math.min(...timePoints);
    const maxTime = Math.max(...timePoints);

    const startAnchor = alignDateToScaleStart(new Date(minTime), timelineScale);
    const totalUnits = calculateTotalUnits(startAnchor, maxTime, timelineScale);
    const headers = generateHeaders(startAnchor, totalUnits, timelineScale);

    const timelineData: TimelineRow[] = parsedItems.map(({ item, start, end }) => {
      const startDate = start ?? baseline;
      const endDate = end ?? startDate;
      const startOffset = calculateStartOffset(startDate, startAnchor, timelineScale);
      const spanUnits = calculateSpanUnits(startDate, endDate, timelineScale);

      return {
        ...item,
        startOffset,
        spanUnits,
        barLabel: `${spanUnits}${UNIT_LABELS[timelineScale]}`,
        color: item.criticalPath ? "hsl(210, 70%, 55%)" : "hsl(210, 6%, 70%)",
      };
    });

    return {
      timelineData,
      totalUnits,
      headers,
    };
  }, [filteredData, timelineScale]);

  const rowVirtualizer = useVirtualizer({
    count: timelineData.length,
    estimateSize: () => ROW_HEIGHT,
    getScrollElement: () => chartContentRef.current,
    overscan: 6,
  });

  useEffect(() => {
    chartContentRef.current?.scrollTo({ top: 0, left: 0 });
  }, [filteredData, timelineScale]);

  const totalRowsHeight = rowVirtualizer.getTotalSize();
  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="overflow-hidden h-full flex flex-col bg-[#03112a]">
          <div className="flex flex-1 overflow-hidden">
            {/* 左侧固定区域（虚拟滚动） */}
            <div className="w-56 flex-shrink-0 flex flex-col">
              {/* 左侧两列表头 */}
              <div className="bg-[#04142d] border-r border-b border-cyan-900/40 h-7 px-2 text-[9px] font-semibold text-cyan-200 grid grid-cols-[minmax(0,1fr)_auto] items-center">
                <span>任务名称</span>
                <span className="text-cyan-300/80">工种/人数</span>
              </div>
              <div className="flex-1 overflow-hidden border-r border-cyan-900/40 bg-[#03112a] relative">
                <div style={{ height: totalRowsHeight, position: "relative" }}>
                  {virtualRows.map((virtualRow) => {
                    const item = timelineData[virtualRow.index];
                    if (!item) return null;

                    return (
                      <div
                        key={item.id}
                        className="border-b border-cyan-900/30 h-7 bg-[#04142d]/40 transition-colors relative group grid grid-cols-[minmax(0,1fr)_auto] items-center"
                        style={{
                          paddingLeft: "8px",
                          paddingRight: "8px",
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: virtualRow.size,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/90" />
                          <div className="font-medium text-[9px] text-cyan-200 truncate">
                            {item.task}
                          </div>
                        </div>
                        <div className="ml-2 flex items-center gap-1 whitespace-nowrap">
                          <Badge
                            className={`rounded-xs text-[8px] px-1 py-0 ${getWorkerBadgeClass(
                              item.worker || "",
                            )}`}
                          >
                            {item.worker}
                          </Badge>
                          <span className="text-[8px] text-cyan-300/80">
                            {formatWorkerCount(item.count)}人
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 右侧整体滚动区域（虚拟滚动） */}
            <div ref={chartContentRef} className="flex-1 overflow-auto flex flex-col">
              <div style={{ minWidth: `${totalUnits * columnWidth}px` }} className="flex-1">
                {/* 时间轴表头 */}
                <div className="bg-[#04142d] border-b border-cyan-900/40 sticky top-0 z-30">
                  <div
                    className="grid gap-0 h-7"
                    style={{
                      gridTemplateColumns: `repeat(${totalUnits}, ${columnWidth}px)`,
                    }}
                  >
                    {headers.map((header) => (
                      <div
                        key={header.key}
                        className={`border-r border-border/50 flex flex-col items-center justify-center text-[9px] p-0 ${
                          header.isWeekend ? "bg-[#0a234a]/70 text-cyan-300/70" : "text-cyan-200"
                        }`}
                      >
                        <div className="font-medium">{header.primary}</div>
                        {header.secondary && (
                          <div className="text-[7px] text-cyan-300/60">{header.secondary}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 甘特图内容 */}
                <div className="flex-1 relative" style={{ height: totalRowsHeight }}>
                  {/* 网格背景使用渐变，避免为每行渲染大量时间单元格 */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `repeating-linear-gradient(to right, rgba(56,189,248,0.12) 0, rgba(56,189,248,0.12) 1px, transparent 1px, transparent ${columnWidth}px), repeating-linear-gradient(to bottom, rgba(56,189,248,0.08) 0, rgba(56,189,248,0.08) 1px, transparent 1px, transparent ${ROW_HEIGHT}px)`,
                    }}
                  />
                  {virtualRows.map((virtualRow) => {
                    const item = timelineData[virtualRow.index];
                    if (!item) return null;

                    return (
                      <div
                        key={item.id}
                        className="absolute left-0 right-0 border-b border-cyan-900/30 hover:bg-[#0a234a]/35 transition-colors"
                        style={{
                          top: 0,
                          height: virtualRow.size,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {/* 任务条 - 可点击 */}
                        <div
                          className="absolute top-0.5 h-6 flex items-center justify-center text-white text-[9px] font-medium shadow-sm animate-fade-in hover:shadow-lg transition-all duration-200 hover:brightness-110 z-[5]"
                          style={{
                            left: `${item.startOffset * columnWidth}px`,
                            width: `${item.spanUnits * columnWidth}px`,
                            backgroundColor: item.color,
                            minWidth: `${columnWidth}px`,
                          }}
                        >
                          <div className="px-2 text-center flex-1">
                            <div className="font-medium">{item.barLabel}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
