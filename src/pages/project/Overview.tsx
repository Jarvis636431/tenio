import { Card, CardContent } from "@/components/ui/card";
import { useMemo, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChartLine,
  Download,
  ListTodo,
  Network,
  Boxes,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useProjectCoreGraph } from "@/hooks/useProjectCoreGraph";
import { useProjectHighlight } from "@/hooks/useProjectHighlight";
import { useProject } from "@/hooks/useProject";
import { useAuth } from "@/hooks/useAuth";
import { useProjectExport } from "@/pages/project/hooks/useProjectExport";
import { usePlanTasks } from "@/pages/project/hooks/usePlanTasks";
import { useDailyProcesses } from "@/pages/project/hooks/useDailyProcesses";
import { useTimelineHighlight } from "@/pages/project/hooks/useTimelineHighlight";
import { ProjectHeader } from "@/pages/project/components/ProjectHeader";
import { PanelCard } from "@/pages/project/components/PanelCard";
import { ProjectSlider } from "@/pages/project/components/ProjectSlider";
import { DailyCard } from "@/pages/project/components/DailyCard";
import { ProjectTrendChart } from "@/pages/project/components/ProjectTrendChart";
import { ModelViewer } from "@/components/model/ModelViewer";
import { GanttChart } from "@/components/plan/gantt/GanttChart";
import { NetworkDiagram } from "@/components/plan/network/NetworkDiagram";
import { TaskDetailDialog } from "@/components/plan/dialogs/TaskDetailDialog";
import { getProjectCostCurve, getProjectHeadcountCurve } from "@/services/schedulepro-service";
import { initAgent } from "@/services/ai-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { PlanTask } from "@/types/domain/plan";
import type { DailyProcessItem } from "@/pages/project/hooks/useDailyProcesses";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OverviewProps {
  projectId?: string;
  projectName?: string;
}

type PanelVisibility = {
  headcount: boolean;
  cost: boolean;
  gantt: boolean;
  network: boolean;
  model: boolean;
};

export function Overview({
  projectId: propsProjectId,
}: OverviewProps = {}) {
  const { id: paramProjectId } = useParams();
  const { currentProject, projects } = useProject();
  const requestedProjectRef = paramProjectId || propsProjectId || currentProject?.id || "";
  const { projectId: resolvedProjectId, coreGraph } = useProjectCoreGraph({
    projectId: requestedProjectRef,
  });
  const { token } = useAuth();
  const { tagMap, processHighlights, getIdsByDate } =
    useProjectHighlight(resolvedProjectId);
  const [currentDay, setCurrentDay] = useState(1);
  const [playbackRate, setPlaybackRate] = useState<1 | 2 | 4>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isResizingModel, setIsResizingModel] = useState(false);
  const [modelPanelRatio, setModelPanelRatio] = useState(0.45);
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>({
    headcount: true,
    cost: true,
    gantt: true,
    network: true,
    model: true,
  });
  const [isTaskDetailDialogOpen, setIsTaskDetailDialogOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] =
    useState<PlanTask | null>(null);
  const fixedHighlightIds = useMemo(
    () => [
      "2j0dIGQjb7IBS38pr73$QB",
      "2j0dIGQjb7IBS38pr73yHp",
      "2j0dIGQjb7IBS38pr73yUZ",
      "2j0dIGQjb7IBS38pr73yUc",
      "2j0dIGQjb7IBS38pr73yUd",
      "2j0dIGQjb7IBS38pr732e1",
    ],
    [],
  );

  const planTasks = usePlanTasks(coreGraph);

  const headcountCurveQuery = useQuery({
    queryKey: ["overview", "headcount-curve", resolvedProjectId],
    queryFn: async () => {
      if (!resolvedProjectId) {
        throw new Error("缺少项目 ID");
      }
      return getProjectHeadcountCurve(resolvedProjectId, token || undefined);
    },
    enabled: Boolean(resolvedProjectId && token),
    refetchOnWindowFocus: false,
  });

  const costCurveQuery = useQuery({
    queryKey: ["overview", "cost-curve", resolvedProjectId],
    queryFn: async () => {
      if (!resolvedProjectId) {
        throw new Error("缺少项目 ID");
      }
      return getProjectCostCurve(resolvedProjectId, token || undefined);
    },
    enabled: Boolean(resolvedProjectId && token),
    refetchOnWindowFocus: false,
  });

  const headcountChartData = useMemo(() => {
    const dates = headcountCurveQuery.data?.dates ?? [];
    const headcounts = headcountCurveQuery.data?.headcounts ?? [];
    const length = Math.min(dates.length, headcounts.length);
    return Array.from({ length }, (_, index) => ({
      date: dates[index],
      劳动力人数: headcounts[index],
    }));
  }, [headcountCurveQuery.data]);

  const costCurveChart = useMemo(() => {
    const dates = costCurveQuery.data?.dates ?? [];
    const totalCosts = costCurveQuery.data?.total_costs ?? [];
    const numericCosts = totalCosts
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    const maxAbsCost = numericCosts.length
      ? Math.max(...numericCosts.map((value) => Math.abs(value)))
      : 0;
    const unitMeta =
      maxAbsCost >= 1e8
        ? { divisor: 1e8, unit: "亿" }
        : maxAbsCost >= 1e4
          ? { divisor: 1e4, unit: "万" }
          : { divisor: 1, unit: "元" };
    const length = Math.min(dates.length, totalCosts.length);
    return {
      unit: unitMeta.unit,
      points: Array.from({ length }, (_, index) => {
        const rawCost = Number(totalCosts[index]);
        const normalized = Number.isFinite(rawCost)
          ? rawCost / unitMeta.divisor
          : 0;
        return {
          date: dates[index],
          总成本: Number(normalized.toFixed(2)),
        };
      }),
    };
  }, [costCurveQuery.data]);

  const currentProjectName = useMemo(() => {
    if (!requestedProjectRef && !resolvedProjectId) {
      return currentProject?.name || "项目详情";
    }
    const matchedProject =
      projects.find((project) => project.id === resolvedProjectId) ||
      projects.find((project) => project.code === requestedProjectRef);
    return (
      matchedProject?.name ||
      currentProject?.name ||
      "项目详情"
    );
  }, [requestedProjectRef, resolvedProjectId, projects, currentProject]);

  const totalDurationLabel = useMemo(() => {
    if (!coreGraph?.work_processes?.length) return "";
    const times = coreGraph.work_processes
      .map((wp) => ({
        start: wp.execution_state?.planned_start_datetime,
        end: wp.execution_state?.planned_end_datetime,
      }))
      .filter((t) => t.start && t.end) as Array<{ start: string; end: string }>;
    if (!times.length) return "";
    const starts = times
      .map((t) => new Date(t.start).getTime())
      .filter((v) => !Number.isNaN(v));
    const ends = times
      .map((t) => new Date(t.end).getTime())
      .filter((v) => !Number.isNaN(v));
    if (!starts.length || !ends.length) return "";
    const minStart = Math.min(...starts);
    const maxEnd = Math.max(...ends);
    const totalDays = Math.max(
      1,
      Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24)) + 1,
    );
    return `${totalDays}天`;
  }, [coreGraph]);

  const onsiteCount = useMemo(() => {
    if (!coreGraph?.work_processes?.length) return undefined;
    const now = Date.now();
    const activeWorkProcesses = coreGraph.work_processes.filter((wp) => {
      const start = wp.execution_state?.planned_start_datetime
        ? new Date(wp.execution_state.planned_start_datetime).getTime()
        : NaN;
      const end = wp.execution_state?.planned_end_datetime
        ? new Date(wp.execution_state.planned_end_datetime).getTime()
        : NaN;
      if (Number.isNaN(start) || Number.isNaN(end)) return false;
      return now >= start && now <= end;
    });
    if (!activeWorkProcesses.length) return 0;
    return activeWorkProcesses.reduce(
      (sum, wp) => sum + (wp.team_size ?? wp.suggested_team_count ?? 0),
      0,
    );
  }, [coreGraph]);

  // 计算项目时间范围 - 处理相对时间
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
    const fmt = (d: Date) =>
      `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
        d.getDate(),
      ).padStart(2, "0")}`;
    return { start: fmt(weekStart), end: fmt(weekEnd), startDate: weekStart, endDate: weekEnd };
  }, [selectedTimelineDate]);

  const timelineProgress = useMemo(() => {
    if (!timeRange) return 0;
    const span = Math.max(1, timeRange.endDay - timeRange.startDay);
    return Math.round(((currentDay - timeRange.startDay) / span) * 100);
  }, [currentDay, timeRange]);

  const { completedIds, inProgressIds } = useTimelineHighlight(
    selectedTimelineDate,
    getIdsByDate,
  );
  const dailyProcesses = useDailyProcesses(
    processHighlights,
    planTasks,
    selectedTimelineDate,
  );
  const dailyTaskNames = useMemo(() => {
    return [...dailyProcesses]
      .sort((a, b) => {
        const aSeq =
          typeof a.seqNo === "number"
            ? a.seqNo
            : Number(a.seqNo ?? Number.MAX_SAFE_INTEGER);
        const bSeq =
          typeof b.seqNo === "number"
            ? b.seqNo
            : Number(b.seqNo ?? Number.MAX_SAFE_INTEGER);
        return aSeq - bSeq;
      })
      .map((item) => item.name);
  }, [dailyProcesses]);
  const dailyDateText = useMemo(() => {
    if (!selectedTimelineDate) return "";
    const y = selectedTimelineDate.getFullYear();
    const m = String(selectedTimelineDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedTimelineDate.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
  }, [selectedTimelineDate]);
  const weeklyTaskNames = useMemo(() => {
    const { startDate, endDate } = reportPeriod;
    if (!startDate || !endDate) return [];
    return planTasks
      .filter((task) => {
        if (!task.startTime || !task.endTime) return false;
        const start = new Date(task.startTime);
        const end = new Date(task.endTime);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
        return end >= startDate && start <= endDate;
      })
      .sort((a, b) => {
        const aSeq = typeof a.seqNo === "number" ? a.seqNo : Number(a.seqNo ?? Number.MAX_SAFE_INTEGER);
        const bSeq = typeof b.seqNo === "number" ? b.seqNo : Number(b.seqNo ?? Number.MAX_SAFE_INTEGER);
        return aSeq - bSeq;
      })
      .map((task) => task.task);
  }, [planTasks, reportPeriod]);
  const plannedWorkerCount = useMemo(() => {
    if (!headcountCurveQuery.data?.dates?.length || !selectedTimelineDateLabel) return undefined;
    const { dates, headcounts } = headcountCurveQuery.data;
    const index = dates.findIndex((date) => date.slice(0, 10) === selectedTimelineDateLabel);
    if (index < 0) return undefined;
    return headcounts[index];
  }, [headcountCurveQuery.data, selectedTimelineDateLabel]);
  const { handleExportWeeklyDOC, handleExportDailyDOC } = useProjectExport(coreGraph, {
    projectName: currentProjectName,
    projectLocation: currentProject?.description ?? "",
    periodStart: reportPeriod.start,
    periodEnd: reportPeriod.end,
    dailyDate: dailyDateText,
    plannedWorkerCount,
    actualWorkerCount: onsiteCount,
    weeklyTaskNames,
    dailyTaskNames,
    progressStatus:
      timelineProgress < 33 ? "超前" : timelineProgress > 80 ? "滞后" : "符合计划",
    remark: "",
  });
  const agentBaseDate = useMemo(() => {
    if (!timeRange?.baseDate) return "";
    const y = timeRange.baseDate.getFullYear();
    const m = String(timeRange.baseDate.getMonth() + 1).padStart(2, "0");
    const d = String(timeRange.baseDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [timeRange]);
  const showTrendPanels = panelVisibility.headcount || panelVisibility.cost;
  const showPlanPanels = panelVisibility.gantt || panelVisibility.network;
  const showModelPanel = panelVisibility.model;
  const hasUpperPanels = showTrendPanels || showPlanPanels;
  const trendVisibleCount = Number(panelVisibility.headcount) + Number(panelVisibility.cost);
  const planVisibleCount = Number(panelVisibility.gantt) + Number(panelVisibility.network);
  const leftColumnRef = useRef<HTMLDivElement | null>(null);
  const agentInitKeyRef = useRef<string | null>(null);
  const visiblePanelCount = useMemo(
    () => Object.values(panelVisibility).filter(Boolean).length,
    [panelVisibility],
  );


  // 初始化当前天数为项目开始天数
  useEffect(() => {
    if (timeRange && currentDay === 1) {
      setCurrentDay(timeRange.startDay);
    }
  }, [timeRange]);

  useEffect(() => {
    if (!resolvedProjectId || !token || !agentBaseDate) return;
    const key = `${resolvedProjectId}:${agentBaseDate}`;
    if (agentInitKeyRef.current === key) return;
    agentInitKeyRef.current = key;

    void initAgent({
      project_id: resolvedProjectId,
      base_date: agentBaseDate,
      solution_id: 0,
      access_token: token,
    }).catch(() => {
      agentInitKeyRef.current = null;
    });
  }, [resolvedProjectId, token, agentBaseDate]);

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

  useEffect(() => {
    if (!isResizingModel) return;

    const handleMouseMove = (event: MouseEvent) => {
      const container = leftColumnRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.height <= 0) return;

      const minUpperPx = 140;
      const minModelPx = 160;
      const offsetY = event.clientY - rect.top;
      const clampedUpper = Math.min(
        Math.max(offsetY, minUpperPx),
        rect.height - minModelPx,
      );
      const ratio = (rect.height - clampedUpper) / rect.height;
      setModelPanelRatio(Math.min(0.8, Math.max(0.25, ratio)));
    };

    const handleMouseUp = () => setIsResizingModel(false);

    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingModel]);

  const handleTaskDetail = (task: PlanTask) => {
    setSelectedTaskForDetail(task);
    setIsTaskDetailDialogOpen(true);
  };

  const handleDailyProcessClick = (item: DailyProcessItem) => {
    const matchedTask =
      planTasks.find((task) => task.id === item.id) ??
      planTasks.find((task) => task.task === item.name);
    if (!matchedTask) return;
    handleTaskDetail(matchedTask);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 bg-gradient-to-b from-[#020a1d] to-[#041332] px-1 pt-0 pb-1 text-slate-100">
      <div className="shrink-0">
        <ProjectHeader
          title={currentProjectName}
          titleExtra={totalDurationLabel ? `总工期：${totalDurationLabel}` : undefined}
          onsiteCount={onsiteCount}
          actions={(
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 border border-[#2f5e94] bg-[#0a2f5f] px-2 text-[#cfe6ff] hover:bg-[#12417c]"
                  >
                    <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                    视图 {visiblePanelCount}/5
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 border-cyan-900/60 bg-[#03112a] text-cyan-100"
                >
                  <DropdownMenuLabel className="text-cyan-200">显示面板</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-cyan-900/60" />
                  <DropdownMenuItem
                    className="focus:bg-[#0a2a5c] focus:text-cyan-100"
                    onSelect={(e) => {
                      e.preventDefault();
                      setPanelVisibility((prev) => ({ ...prev, headcount: !prev.headcount }));
                    }}
                  >
                    <Users className="mr-2 h-4 w-4 text-cyan-300" />
                    <span className="flex-1">劳动力曲线</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
                      {panelVisibility.headcount && <Check className="h-3 w-3 text-cyan-200" />}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-[#0a2a5c] focus:text-cyan-100"
                    onSelect={(e) => {
                      e.preventDefault();
                      setPanelVisibility((prev) => ({ ...prev, cost: !prev.cost }));
                    }}
                  >
                    <ChartLine className="mr-2 h-4 w-4 text-emerald-300" />
                    <span className="flex-1">资金曲线</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
                      {panelVisibility.cost && <Check className="h-3 w-3 text-cyan-200" />}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-[#0a2a5c] focus:text-cyan-100"
                    onSelect={(e) => {
                      e.preventDefault();
                      setPanelVisibility((prev) => ({ ...prev, gantt: !prev.gantt }));
                    }}
                  >
                    <ListTodo className="mr-2 h-4 w-4 text-amber-300" />
                    <span className="flex-1">甘特图</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
                      {panelVisibility.gantt && <Check className="h-3 w-3 text-cyan-200" />}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-[#0a2a5c] focus:text-cyan-100"
                    onSelect={(e) => {
                      e.preventDefault();
                      setPanelVisibility((prev) => ({ ...prev, network: !prev.network }));
                    }}
                  >
                    <Network className="mr-2 h-4 w-4 text-violet-300" />
                    <span className="flex-1">网络图</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
                      {panelVisibility.network && <Check className="h-3 w-3 text-cyan-200" />}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-[#0a2a5c] focus:text-cyan-100"
                    onSelect={(e) => {
                      e.preventDefault();
                      setPanelVisibility((prev) => ({ ...prev, model: !prev.model }));
                    }}
                  >
                    <Boxes className="mr-2 h-4 w-4 text-cyan-300" />
                    <span className="flex-1">模型区</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-cyan-700/70">
                      {panelVisibility.model && <Check className="h-3 w-3 text-cyan-200" />}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 border border-[#2f5e94] bg-[#0a2f5f] px-3 text-[#cfe6ff] hover:bg-[#12417c]"
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    报告导出
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[var(--radix-dropdown-menu-trigger-width)] border-cyan-900/60 bg-[#03112a] text-cyan-100"
                >
                  <DropdownMenuItem
                    className="focus:bg-[#0a2a5c] focus:text-cyan-100"
                    onSelect={(e) => {
                      e.preventDefault();
                      handleExportWeeklyDOC();
                    }}
                  >
                    导出周报
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-[#0a2a5c] focus:text-cyan-100"
                    onSelect={(e) => {
                      e.preventDefault();
                      handleExportDailyDOC();
                    }}
                  >
                    导出日报
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        />
      </div>

      {timeRange && (
        <ProjectSlider
          currentDay={currentDay}
          startDay={timeRange.startDay}
          endDay={timeRange.endDay}
          playbackRate={playbackRate}
          isPlaying={isPlaying}
          dateLabel={selectedTimelineDateLabel}
          progress={timelineProgress}
          onPreviousDay={() => {
            setIsPlaying(false);
            setCurrentDay((d) => Math.max(timeRange.startDay, d - 1));
          }}
          onTogglePlay={() => {
            if (currentDay >= timeRange.endDay) {
              setCurrentDay(timeRange.startDay);
              setIsPlaying(true);
              return;
            }
            setIsPlaying((prev) => !prev);
          }}
          onNextDay={() => {
            setIsPlaying(false);
            setCurrentDay((d) => Math.min(timeRange.endDay, d + 1));
          }}
          onChangeRate={setPlaybackRate}
          onChangeDay={(day) => {
            setIsPlaying(false);
            setCurrentDay(day);
          }}
        />
      )}

      <div className="grid min-h-0 flex-1 grid-cols-10 gap-2 overflow-hidden">
        <div
          ref={leftColumnRef}
          className="col-span-7 min-w-0 flex min-h-0 flex-col gap-2 overflow-hidden"
        >
          {hasUpperPanels && (
            <div
              className="min-h-0 flex flex-col gap-2"
              style={{ flex: showModelPanel ? `${1 - modelPanelRatio} 1 0%` : "1 1 0%" }}
            >
              {showTrendPanels && (
                <div
                  className={`grid min-h-0 min-w-0 grid-cols-1 gap-2 ${
                    trendVisibleCount > 1 ? "lg:grid-cols-2" : "lg:grid-cols-1"
                  }`}
                  style={{ flex: showPlanPanels ? "1 1 0%" : "1 1 0%" }}
                >
                  {panelVisibility.headcount && (
                    <PanelCard
                      title="劳动力曲线"
                      icon={<Users className="h-3.5 w-3.5 text-cyan-300" />}
                      titleClassName="text-cyan-200"
                    >
                      {headcountCurveQuery.isLoading ? (
                        <Skeleton className="h-full w-full" />
                      ) : headcountCurveQuery.isError ? (
                        <div className="flex h-full items-center justify-center text-sm text-destructive">
                          无法获取人员数据
                        </div>
                      ) : headcountChartData.length > 0 ? (
                        <div className="h-full w-full">
                          <ProjectTrendChart
                            data={headcountChartData}
                            seriesNames={["劳动力人数"]}
                            unit="人"
                          />
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-cyan-300/70">
                          暂无人员数据
                        </div>
                      )}
                    </PanelCard>
                  )}

                  {panelVisibility.cost && (
                    <PanelCard
                      title="资金曲线"
                      icon={<ChartLine className="h-3.5 w-3.5 text-emerald-400" />}
                      titleClassName="text-emerald-300"
                    >
                      {costCurveQuery.isLoading ? (
                        <Skeleton className="h-full w-full" />
                      ) : costCurveQuery.isError ? (
                        <div className="flex h-full items-center justify-center text-sm text-destructive">
                          无法获取成本数据
                        </div>
                      ) : costCurveChart.points.length > 0 ? (
                        <div className="h-full w-full">
                          <ProjectTrendChart
                            data={costCurveChart.points}
                            seriesNames={["总成本"]}
                            unit={costCurveChart.unit}
                          />
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-cyan-300/70">
                          暂无成本数据
                        </div>
                      )}
                    </PanelCard>
                  )}
                </div>
              )}

              {showPlanPanels && (
                <div
                  className={`grid min-h-0 min-w-0 grid-cols-1 gap-2 ${
                    planVisibleCount > 1 ? "lg:grid-cols-2" : "lg:grid-cols-1"
                  }`}
                  style={{ flex: showTrendPanels ? "1 1 0%" : "1 1 0%" }}
                >
                  {panelVisibility.gantt && (
                    <PanelCard
                      title="甘特图"
                      icon={<ListTodo className="h-3.5 w-3.5 text-amber-400" />}
                      titleClassName="text-amber-300"
                    >
                      {planTasks.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-cyan-300/70">
                          当前项目暂无施工任务数据
                        </div>
                      ) : (
                        <div className="h-full min-h-0 overflow-hidden">
                          <GanttChart
                            data={planTasks}
                            onTaskDetail={handleTaskDetail}
                            scale="day"
                            currentDate={selectedTimelineDate}
                          />
                        </div>
                      )}
                    </PanelCard>
                  )}

                  {panelVisibility.network && (
                    <PanelCard
                      title="网络图"
                      icon={<Network className="h-3.5 w-3.5 text-violet-400" />}
                      titleClassName="text-violet-300"
                    >
                      {planTasks.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-cyan-300/70">
                          当前项目暂无施工任务数据
                        </div>
                      ) : (
                        <div className="h-full min-h-0 overflow-hidden">
                          <NetworkDiagram
                            tasks={planTasks}
                            onNodeClick={handleTaskDetail}
                            currentDate={selectedTimelineDate}
                          />
                        </div>
                      )}
                    </PanelCard>
                  )}
                </div>
              )}
            </div>
          )}

          {showModelPanel && hasUpperPanels && (
            <div
              className="group relative h-2 shrink-0 cursor-row-resize"
              onMouseDown={() => setIsResizingModel(true)}
              title="拖拽调整模型区高度"
            >
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-cyan-900/60 transition-colors group-hover:bg-cyan-500/90" />
            </div>
          )}

          {showModelPanel && (
            <div
              className="min-h-0"
              style={{ flex: hasUpperPanels ? `${modelPanelRatio} 1 0%` : "1 1 0%" }}
            >
              <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-cyan-900/40 bg-[#071a39]/75">
                <CardContent className="flex-1 min-h-0 p-0">
                  <div className="flex h-full min-h-0 flex-col gap-2">
                    <div className="relative min-h-0 flex-1 w-full">
                      <ModelViewer
                        models={[
                          {
                            key: "default",
                            src: "/models/0202.ifc",
                            tagMap,
                          },
                        ]}
                        baseMaterialOverrides={{ transparent: true, opacity: 0 }}
                        highlightColorGroups={[
                          {
                            ids: completedIds,
                            color: "#22c55e",
                            opacity: 0.18,
                            customID: "completed",
                          },
                          {
                            ids: inProgressIds,
                            color: "#f59e0b",
                            opacity: 1,
                            customID: "inProgress",
                          },
                          {
                            ids: fixedHighlightIds,
                            color: "#000000",
                            opacity: 0.05,
                            customID: "fixed",
                          },
                        ]}
                        className="h-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DailyCard
          items={dailyProcesses}
          onItemClick={handleDailyProcessClick}
        />
      </div>

      <TaskDetailDialog
        open={isTaskDetailDialogOpen}
        onOpenChange={setIsTaskDetailDialogOpen}
        task={selectedTaskForDetail}
        projectId={resolvedProjectId || currentProject?.id || undefined}
        workProcessName={selectedTaskForDetail?.task}
      />
    </div>
  );
}
