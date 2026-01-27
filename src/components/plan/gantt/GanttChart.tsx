import { useMemo, useRef, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { NewTaskDialog } from "../dialogs/NewTaskDialog";
import { TaskDetailDialog } from "../dialogs/TaskDetailDialog";
import { useProject } from "@/hooks/useProject";
import type { ShutdownEventConfig } from "@/types/domain/project";
import type { PlanTask, TimelineScale } from "@/types/domain/plan";

interface GanttChartProps {
  data: PlanTask[];
  onTaskDetail?: (task: PlanTask) => void;
  onAddTask?: (task: Partial<PlanTask>) => void;
  scale?: TimelineScale;
  shutdownEvents?: ShutdownEventConfig[];
}

const BASELINE_DATE = new Date(2025, 0, 1); // 2025-10-01
const MS_IN_HOUR = 1000 * 60 * 60;
const MS_IN_DAY = MS_IN_HOUR * 24;
const MS_IN_WEEK = MS_IN_DAY * 7;

const COLUMN_WIDTH_MAP: Record<TimelineScale, number> = {
  day: 80,
  hour: 60,
  week: 100,
  month: 120,
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
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
};

const getWeekStart = (date: Date) => {
  const weekStart = new Date(date.getTime());
  const dayOfWeek = weekStart.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 周日为0，需要调整为6天前
  weekStart.setDate(weekStart.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const calculateTotalUnits = (
  startAnchor: Date,
  maxTime: number,
  scale: TimelineScale,
) => {
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

const calculateStartOffset = (
  start: Date,
  startAnchor: Date,
  scale: TimelineScale,
) => {
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

// 新增任务的表单数据类型，替代 any
interface NewTaskFormData {
  task: string;
  startTime: string;
  endTime: string;
  jobType?: string;
  workerCount?: number;
}

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

const getBaselineDate = () => {
  const baseline = new Date(BASELINE_DATE.getTime());
  baseline.setHours(0, 0, 0, 0);
  return baseline;
};

const parseDate = (dateStr: string): Date => {
  if (!dateStr) {
    return getBaselineDate();
  }

  const trimmed = dateStr.trim();

  // 解析 "2025/09/01" 或 "2025/09/01 08:00" 格式的日期
  if (trimmed.includes("/")) {
    const [datePart, timePart] = trimmed.split(/\s+/);
    const parts = datePart.split("/");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (timePart) {
        const [hours, minutes] = timePart
          .split(":")
          .map((v) => parseInt(v, 10));
        if (!Number.isNaN(hours)) {
          date.setHours(hours);
        }
        if (!Number.isNaN(minutes)) {
          date.setMinutes(minutes);
        }
      }
      return date;
    }
  }

  // 解析相对格式 "第X天 08:00" 或 "第X天08:00"
  const relativeMatch = trimmed.match(
    /第\s*(\d+)\s*天\s*([0-9]{1,2})(?::([0-9]{2}))?/,
  );
  if (relativeMatch) {
    const day = parseInt(relativeMatch[1], 10);
    const hours = relativeMatch[2] ? parseInt(relativeMatch[2], 10) : 0;
    const minutes = relativeMatch[3] ? parseInt(relativeMatch[3], 10) : 0;
    const base = getBaselineDate();
    if (!Number.isNaN(day) && day > 0) {
      base.setDate(base.getDate() + day - 1);
    }
    base.setHours(hours || 0, minutes || 0, 0, 0);
    return base;
  }

  const relativeMatchNoTime = trimmed.match(/第\s*(\d+)\s*天/);
  if (relativeMatchNoTime) {
    const day = parseInt(relativeMatchNoTime[1], 10);
    const base = getBaselineDate();
    if (!Number.isNaN(day) && day > 0) {
      base.setDate(base.getDate() + day - 1);
    }
    base.setHours(0, 0, 0, 0);
    return base;
  }

  // 兼容旧的 "8月1日" 格式
  const match = trimmed.match(/(\d+)月(\d+)日/);
  if (match) {
    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    const base = getBaselineDate();
    base.setMonth(month, day);
    base.setHours(0, 0, 0, 0);
    return base;
  }

  // 如果无法解析，返回基准日期避免 NaN
  return getBaselineDate();
};

export function GanttChart({
  data,
  onTaskDetail,
  onAddTask,
  scale = "day",
  shutdownEvents = [],
}: GanttChartProps) {
  const taskListRef = useRef<HTMLDivElement>(null);
  const chartContentRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const [showDetailButton, setShowDetailButton] = useState<number | null>(null);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [isTaskDetailDialogOpen, setIsTaskDetailDialogOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] =
    useState<PlanTask | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const { currentProject } = useProject();

  const ROW_HEIGHT = 48; // h-12
  const timelineScale = scale;
  const columnWidth = COLUMN_WIDTH_MAP[timelineScale];

  const { timelineData, totalUnits, headers, startAnchor } = useMemo(() => {
    const baseline = getBaselineDate();
    const parsedItems = data.map((item) => ({
      item,
      start: parseDate(item.startDate),
      end: parseDate(item.endDate),
    }));

    const timePoints = parsedItems.flatMap(({ start, end }) => [
      start.getTime(),
      end.getTime(),
    ]);
    timePoints.push(baseline.getTime());

    const minTime = Math.min(...timePoints);
    const maxTime = Math.max(...timePoints);

    const startAnchor = alignDateToScaleStart(new Date(minTime), timelineScale);
    const totalUnits = calculateTotalUnits(startAnchor, maxTime, timelineScale);
    const headers = generateHeaders(startAnchor, totalUnits, timelineScale);

    const timelineData: TimelineRow[] = parsedItems.map(
      ({ item, start, end }) => {
        const startOffset = calculateStartOffset(
          start,
          startAnchor,
          timelineScale,
        );
        const spanUnits = calculateSpanUnits(start, end, timelineScale);

        return {
          ...item,
          startOffset,
          spanUnits,
          barLabel: `${spanUnits}${UNIT_LABELS[timelineScale]}`,
          color: "hsl(210, 70%, 65%)", // 统一为蓝色
        };
      },
    );

    return {
      timelineData,
      totalUnits,
      headers,
      startAnchor,
    };
  }, [data, timelineScale]);

  // 计算停工期遮罩段，仅用于内容区渲染
  const shutdownSegments = useMemo(() => {
    if (!shutdownEvents || shutdownEvents.length === 0)
      return [] as { left: number; width: number; key: string }[];

    const base = getBaselineDate();

    return shutdownEvents
      .map((ev, idx) => {
        const sDay = Math.max(1, Number(ev?.start_time?.day ?? 1));
        const sHour = Math.max(0, Number(ev?.start_time?.hour ?? 0));
        const eDay = Math.max(sDay, Number(ev?.end_time?.day ?? sDay));
        const eHour = Math.max(0, Number(ev?.end_time?.hour ?? sHour));

        const startDate = new Date(base);
        startDate.setDate(base.getDate() + (sDay - 1));
        startDate.setHours(sHour, 0, 0, 0);

        const endDate = new Date(base);
        endDate.setDate(base.getDate() + (eDay - 1));
        endDate.setHours(eHour, 0, 0, 0);

        const startOffsetUnits = calculateStartOffset(
          startDate,
          startAnchor,
          timelineScale,
        );
        const spanUnits = calculateSpanUnits(startDate, endDate, timelineScale);

        if (startOffsetUnits >= totalUnits || spanUnits <= 0) {
          return null;
        }
        const maxUnits = Math.max(0, totalUnits - startOffsetUnits);
        const effectiveUnits = Math.max(0, Math.min(spanUnits, maxUnits));

        return {
          left: startOffsetUnits * columnWidth,
          width: Math.max(columnWidth, effectiveUnits * columnWidth),
          key: `${idx}-${sDay}-${sHour}-${eDay}-${eHour}`,
        };
      })
      .filter(Boolean) as { left: number; width: number; key: string }[];
  }, [shutdownEvents, columnWidth, totalUnits, timelineScale, startAnchor]);

  useEffect(() => {
    console.debug("[gantt] shutdownEvents changed", {
      count: shutdownEvents?.length ?? 0,
    });
  }, [shutdownEvents]);

  const totalRows = timelineData.length;
  const visibleRowCount = 12; // 渲染窗口中的最大行数
  const startRowIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2);
  const endRowIndex = Math.min(totalRows, startRowIndex + visibleRowCount + 4);
  const visibleRows = timelineData.slice(startRowIndex, endRowIndex);

  // 同步滚动逻辑 - 只监听右侧滚动，同步到左侧
  useEffect(() => {
    const taskList = taskListRef.current;
    const chartContent = chartContentRef.current;

    if (!taskList || !chartContent) return;

    const handleChartScroll = () => {
      if (isScrolling) return;
      setIsScrolling(true);
      taskList.scrollTop = chartContent.scrollTop;
      setScrollTop(chartContent.scrollTop);
      setTimeout(() => setIsScrolling(false), 10);
    };

    // 重置滚动位置
    taskList.scrollTop = 0;
    chartContent.scrollTop = 0;

    chartContent.addEventListener("scroll", handleChartScroll, {
      passive: true,
    });

    return () => {
      chartContent.removeEventListener("scroll", handleChartScroll);
    };
  }, [data]); // 数据变化时重新建立同步并重置滚动位置

  // 生成日期标头

  const handleAddTask = (taskData: NewTaskFormData) => {
    if (onAddTask) {
      const newTask: Partial<PlanTask> = {
        task: taskData.task,
        startDate: taskData.startTime,
        endDate: taskData.endTime,
        duration: "1天",
        worker: taskData.jobType,
        count: taskData.workerCount,
        floor: 1,
      };
      onAddTask(newTask);
    }
  };

  const handleMoreClick = (task: PlanTask) => {
    setSelectedTaskForDetail(task);
    setIsTaskDetailDialogOpen(true);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="border rounded-lg overflow-hidden h-full flex flex-col">
          <div className="flex flex-1 overflow-hidden">
            {/* 左侧固定区域（虚拟滚动） */}
            <div className="w-80 flex-shrink-0 flex flex-col">
              {/* 任务名称表头 */}
              <div className="bg-muted/50 border-r border-b p-3 font-semibold h-12 flex items-center">
                任务名称
              </div>
              {/* 任务列表（虚拟高度容器） */}
              <div
                ref={taskListRef}
                className="flex-1 overflow-hidden border-r bg-background relative"
              >
                <div style={{ height: totalRows * ROW_HEIGHT }} />
                {visibleRows.map((item, i) => {
                  const rowIndex = startRowIndex + i;
                  const top = rowIndex * ROW_HEIGHT;
                  return (
                    <div
                      key={item.id}
                      className="border-b p-2 flex items-center justify-between h-12 bg-gray-50/50 transition-colors relative group"
                      onMouseEnter={() => {
                        setHoveredTaskId(item.id);
                        if (hoverTimeoutRef.current)
                          clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = setTimeout(
                          () => setShowDetailButton(item.id),
                          150,
                        );
                      }}
                      onMouseLeave={() => {
                        setHoveredTaskId(null);
                        setShowDetailButton(null);
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                          hoverTimeoutRef.current = null;
                        }
                      }}
                      style={{
                        paddingLeft: "8px",
                        paddingRight: "8px",
                        position: "absolute",
                        top,
                        left: 0,
                        right: 0,
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="font-medium text-sm truncate max-w-[200px]">
                          {item.task}
                        </div>
                        <div className="w-px h-4 bg-border flex-shrink-0"></div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge
                            className={`text-xs ${getWorkerBadgeClass(
                              item.worker || "",
                            )}`}
                          >
                            {item.worker}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.count}人
                          </span>
                        </div>
                      </div>
                      {showDetailButton === item.id && onTaskDetail && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-8 px-3 opacity-100 transition-all duration-200 z-20 bg-white/95 backdrop-blur-sm border-primary/30 text-primary hover:text-white hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 hover:border-primary shadow-lg hover:shadow-xl"
                          onClick={() => onTaskDetail(item)}
                        >
                          详情
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 右侧整体滚动区域（虚拟滚动） */}
            <div
              ref={chartContentRef}
              className="flex-1 overflow-auto flex flex-col"
            >
              <div
                style={{ minWidth: `${totalUnits * columnWidth}px` }}
                className="flex-1"
              >
                {/* 时间轴表头 */}
                <div className="bg-muted/50 border-b sticky top-0 z-10">
                  <div
                    className="grid gap-0 h-12"
                    style={{
                      gridTemplateColumns: `repeat(${totalUnits}, ${columnWidth}px)`,
                    }}
                  >
                    {headers.map((header) => (
                      <div
                        key={header.key}
                        className={`border-r border-border/50 flex flex-col items-center justify-center text-xs p-1 ${
                          header.isWeekend
                            ? "bg-muted/70 text-muted-foreground"
                            : ""
                        }`}
                      >
                        <div className="font-medium">{header.primary}</div>
                        {header.secondary && (
                          <div className="text-[10px] text-muted-foreground">
                            {header.secondary}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 甘特图内容 */}
                <div
                  className="flex-1 relative"
                  style={{ height: totalRows * ROW_HEIGHT }}
                >
                  {/* 网格背景使用渐变，避免为每行渲染大量时间单元格 */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `repeating-linear-gradient(to right, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 1px, transparent 1px, transparent ${columnWidth}px), repeating-linear-gradient(to bottom, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 1px, transparent 1px, transparent ${ROW_HEIGHT}px)`,
                    }}
                  />
                  {/* 停工期遮罩：覆盖内容区列，置于任务条下方 */}
                  {shutdownSegments.map((seg) => (
                    <div
                      key={seg.key}
                      className="absolute top-0 bottom-0 bg-red-200/40 pointer-events-none z-0"
                      style={{ left: seg.left, width: seg.width }}
                      aria-hidden="true"
                    />
                  ))}
                  {visibleRows.map((item, i) => {
                    const rowIndex = startRowIndex + i;
                    const top = rowIndex * ROW_HEIGHT;
                    return (
                      <div
                        key={item.id}
                        className="absolute left-0 right-0 border-b hover:bg-gray-50 transition-colors"
                        style={{ top, height: ROW_HEIGHT }}
                        onMouseEnter={() => setHoveredTaskId(item.id)}
                        onMouseLeave={() => setHoveredTaskId(null)}
                      >
                        {/* 任务条 - 可点击 */}
                        <div
                          className="absolute top-1 h-10 rounded-md flex items-center justify-center text-white text-xs font-medium shadow-sm animate-fade-in cursor-pointer hover:shadow-lg transition-all duration-200 hover:brightness-110 z-10"
                          style={{
                            left: `${item.startOffset * columnWidth}px`,
                            width: `${item.spanUnits * columnWidth}px`,
                            backgroundColor: item.color,
                            minWidth: `${columnWidth}px`,
                          }}
                          onClick={() => onTaskDetail?.(item)}
                        >
                          <div className="px-2 text-center flex-1">
                            <div className="font-medium">{item.barLabel}</div>
                          </div>
                          {/* 更多按钮 - 悬停时显示 */}
                          {hoveredTaskId === item.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 mr-1 opacity-80 hover:opacity-100 transition-opacity z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoreClick(item);
                              }}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          )}
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

      {/* 新增任务对话框 */}
      <NewTaskDialog
        open={isNewTaskDialogOpen}
        onOpenChange={setIsNewTaskDialogOpen}
        onAdd={handleAddTask}
        existingTasks={data.map((item) => ({
          id: item.id,
          task: item.task,
          specialty: "",
          component: "",
          workerCount: item.count,
          jobType: item.worker,
          totalCost: 0,
          startTime: item.startDate,
          endTime: item.endDate,
          constructionSituation: "",
          prerequisiteProcess: "",
          quantity: 0,
          quantityUnit: "",
          overtime: "",
          duration: item.duration,
          actualWorkDays: 0,
          constructionMethod: "",
          directDependency: "",
          remarks: "",
          selectedConstructionMethod: "",
          materialCost: 0,
          laborCost: 0,
          floor: item.floor || 1,
        }))}
        projectId={currentProject?.id ?? ""}
      />

      {/* 任务详情对话框 */}
      <TaskDetailDialog
        open={isTaskDetailDialogOpen}
        onOpenChange={setIsTaskDetailDialogOpen}
        task={selectedTaskForDetail}
        projectId={currentProject?.id}
        workProcessName={selectedTaskForDetail?.task}
      />
    </div>
  );
}
