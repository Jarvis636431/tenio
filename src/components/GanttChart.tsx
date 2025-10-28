import { useMemo, useRef, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Plus, MoreHorizontal } from "lucide-react";
import { NewTaskDialog } from "./NewTaskDialog";
import { TaskDetailDialog } from "./TaskDetailDialog";
import { useProject } from "@/contexts/ProjectContext";

interface ScheduleItem {
  id: number;
  task: string;
  startDate: string;
  endDate: string;
  duration: string;
  worker: string;
  count: number;
  floor?: number;
}

interface GanttChartProps {
  data: ScheduleItem[];
  onTaskDetail?: (task: ScheduleItem) => void;
  onAddTask?: (task: Partial<ScheduleItem>) => void;
}

const getWorkerColor = (worker: string): string => {
  const colors: {
    [key: string]: string;
  } = {
    "钢筋工": "hsl(210, 70%, 65%)", // lighter blue
    "混凝土工": "hsl(25, 75%, 70%)", // lighter orange
    "木工": "hsl(40, 80%, 70%)", // lighter yellow
    "测量员": "hsl(255, 60%, 65%)", // lighter purple
    "土方工": "hsl(25, 75%, 70%)", // lighter orange
    "砌筑工": "hsl(165, 60%, 60%)", // lighter green
    "抹灰工": "hsl(255, 60%, 65%)", // lighter purple
    "防水工": "hsl(210, 70%, 65%)", // lighter blue
    "水电工": "hsl(165, 60%, 60%)", // lighter green
    "油漆工": "hsl(40, 80%, 70%)", // lighter yellow
    "油工": "hsl(40, 80%, 70%)", // lighter yellow
    "瓦工": "hsl(355, 70%, 70%)", // lighter red
    "不限": "#9ca3af"
  };
  return colors[worker] || "#9ca3af";
};

const getWorkerBadgeClass = (worker: string): string => {
  const badgeClasses: {
    [key: string]: string;
  } = {
    "钢筋工": "bg-category-blue-100 text-category-blue-800 border-category-blue-200 hover:bg-category-blue-100 hover:text-category-blue-800",
    "混凝土工": "bg-category-orange-100 text-category-orange-800 border-category-orange-200 hover:bg-category-orange-100 hover:text-category-orange-800",
    "木工": "bg-category-yellow-100 text-category-yellow-800 border-category-yellow-200 hover:bg-category-yellow-100 hover:text-category-yellow-800",
    "测量员": "bg-category-purple-100 text-category-purple-800 border-category-purple-200 hover:bg-category-purple-100 hover:text-category-purple-800",
    "土方工": "bg-category-orange-100 text-category-orange-800 border-category-orange-200 hover:bg-category-orange-100 hover:text-category-orange-800",
    "砌筑工": "bg-category-green-100 text-category-green-800 border-category-green-200 hover:bg-category-green-100 hover:text-category-green-800",
    "抹灰工": "bg-category-purple-100 text-category-purple-800 border-category-purple-200 hover:bg-category-purple-100 hover:text-category-purple-800",
    "防水工": "bg-category-blue-100 text-category-blue-800 border-category-blue-200 hover:bg-category-blue-100 hover:text-category-blue-800",
    "水电工": "bg-category-green-100 text-category-green-800 border-category-green-200 hover:bg-category-green-100 hover:text-category-green-800",
    "油漆工": "bg-category-yellow-100 text-category-yellow-800 border-category-yellow-200 hover:bg-category-yellow-100 hover:text-category-yellow-800",
    "油工": "bg-category-yellow-100 text-category-yellow-800 border-category-yellow-200 hover:bg-category-yellow-100 hover:text-category-yellow-800",
    "瓦工": "bg-category-red-100 text-category-red-800 border-category-red-200 hover:bg-category-red-100 hover:text-category-red-800",
    "不限": "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 hover:text-gray-800"
  };
  return badgeClasses[worker] || "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 hover:text-gray-800";
};

const parseDate = (dateStr: string): Date => {
  if (!dateStr) {
    return new Date(2024, 0, 1);
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
        const [hours, minutes] = timePart.split(":").map((v) => parseInt(v, 10));
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
  const relativeMatch = trimmed.match(/第\s*(\d+)\s*天\s*([0-9]{1,2})(?::([0-9]{2}))?/);
  if (relativeMatch) {
    const day = parseInt(relativeMatch[1], 10);
    const hours = relativeMatch[2] ? parseInt(relativeMatch[2], 10) : 0;
    const minutes = relativeMatch[3] ? parseInt(relativeMatch[3], 10) : 0;
    const base = new Date(2024, 0, 1);
    if (!Number.isNaN(day) && day > 0) {
      base.setDate(base.getDate() + day - 1);
    }
    base.setHours(hours || 0, minutes || 0, 0, 0);
    return base;
  }

  const relativeMatchNoTime = trimmed.match(/第\s*(\d+)\s*天/);
  if (relativeMatchNoTime) {
    const day = parseInt(relativeMatchNoTime[1], 10);
    const base = new Date(2024, 0, 1);
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
    return new Date(2024, month, day);
  }

  // 如果无法解析，返回基准日期避免 NaN
  return new Date(2024, 0, 1);
};

export function GanttChart({ data, onTaskDetail, onAddTask }: GanttChartProps) {
  const taskListRef = useRef<HTMLDivElement>(null);
  const chartContentRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const [showDetailButton, setShowDetailButton] = useState<number | null>(null);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [isTaskDetailDialogOpen, setIsTaskDetailDialogOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<ScheduleItem | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const { currentProject } = useProject();

  const ROW_HEIGHT = 48; // h-12
  const COL_WIDTH = 80;

  const {
    timelineData,
    totalDays,
    startDate
  } = useMemo(() => {
    const dates = data.flatMap(item => [parseDate(item.startDate), parseDate(item.endDate)]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const timelineData = data.map(item => {
      const start = parseDate(item.startDate);
      const end = parseDate(item.endDate);
      const startDay = Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      return {
        ...item,
        startDay,
        duration: Math.max(duration, 1).toString(),
        color: getWorkerColor(item.worker)
      };
    });

    return {
      timelineData,
      totalDays,
      startDate: minDate
    };
  }, [data]);

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

    chartContent.addEventListener('scroll', handleChartScroll, { passive: true });

    return () => {
      chartContent.removeEventListener('scroll', handleChartScroll);
    };
  }, [data]); // 数据变化时重新建立同步并重置滚动位置

  // 生成日期标头
  const dateHeaders = Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);
    return {
      day: index + 1,
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      dayOfWeek: date.getDay()
    };
  });

  const handleAddTask = (taskData: any) => {
    if (onAddTask) {
      const newTask: Partial<ScheduleItem> = {
        task: taskData.task,
        startDate: taskData.startTime,
        endDate: taskData.endTime,
        duration: "1天",
        worker: taskData.jobType,
        count: taskData.workerCount,
        floor: 1
      };
      onAddTask(newTask);
    }
  };

  const handleMoreClick = (task: ScheduleItem) => {
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
              <div ref={taskListRef} className="flex-1 overflow-hidden border-r bg-background relative">
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
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = setTimeout(() => setShowDetailButton(item.id), 150);
                      }}
                      onMouseLeave={() => {
                        setHoveredTaskId(null);
                        setShowDetailButton(null);
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                          hoverTimeoutRef.current = null;
                        }
                      }}
                      style={{ paddingLeft: '8px', paddingRight: '8px', position: 'absolute', top, left: 0, right: 0 }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="font-medium text-sm truncate max-w-[200px]">{item.task}</div>
                        <div className="w-px h-4 bg-border flex-shrink-0"></div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={`text-xs ${getWorkerBadgeClass(item.worker)}`}>
                            {item.worker}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.count}人</span>
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
            <div ref={chartContentRef} className="flex-1 overflow-auto flex flex-col">
              <div style={{ minWidth: `${totalDays * COL_WIDTH}px` }} className="flex-1">
                {/* 时间轴表头 */}
                <div className="bg-muted/50 border-b sticky top-0 z-10">
                  <div className="grid gap-0 h-12" style={{
                    gridTemplateColumns: `repeat(${totalDays}, ${COL_WIDTH}px)`
                  }}>
                    {dateHeaders.map(header => (
                      <div key={header.day} className={`border-r border-border/50 flex flex-col items-center justify-center text-xs p-1 ${header.dayOfWeek === 0 || header.dayOfWeek === 6 ? 'bg-muted/70 text-muted-foreground' : ''}`}>
                        <div className="font-medium">{header.date}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {['日', '一', '二', '三', '四', '五', '六'][header.dayOfWeek]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 甘特图内容 */}
                <div className="flex-1 relative" style={{ height: totalRows * ROW_HEIGHT }}>
                  {/* 网格背景使用渐变，避免为每行渲染 totalDays 个单元格 */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `repeating-linear-gradient(to right, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 1px, transparent 1px, transparent ${COL_WIDTH}px), repeating-linear-gradient(to bottom, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 1px, transparent 1px, transparent ${ROW_HEIGHT}px)`
                    }}
                  />
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
                          className="absolute top-1 h-10 rounded-md flex items-center justify-center text-white text-xs font-medium shadow-sm animate-fade-in cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 hover:brightness-110"
                          style={{
                            left: `${item.startDay * COL_WIDTH}px`,
                            width: `${Number(item.duration) * COL_WIDTH}px`,
                            backgroundColor: getWorkerColor(item.worker),
                            minWidth: `${COL_WIDTH}px`
                          }}
                          onClick={() => onTaskDetail?.(item)}
                        >
                          <div className="px-2 text-center flex-1">
                            <div className="font-medium">{item.duration}天</div>
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
        existingTasks={data.map(item => ({
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
          floor: item.floor || 1
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
