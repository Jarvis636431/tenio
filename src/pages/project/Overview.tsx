import { Card, CardContent } from "@/components/ui/card";
import { useMemo, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChartLine, ListTodo, Network, Users } from "lucide-react";
import { useProjectCoreGraph } from "@/hooks/useProjectCoreGraph";
import { useProjectHighlight } from "@/hooks/useProjectHighlight";
import { useProject } from "@/hooks/useProject";
import { useProjectExport } from "@/pages/project/hooks/useProjectExport";
import { useOverviewActions } from "@/pages/project/hooks/useOverviewActions";
import { usePlanTasks } from "@/pages/project/hooks/usePlanTasks";
import { useDailyProcesses } from "@/pages/project/hooks/useDailyProcesses";
import { useOverviewMetrics } from "@/pages/project/hooks/useOverviewMetrics";
import { useOverviewTimeline } from "@/pages/project/hooks/useOverviewTimeline";
import { OverviewHeaderActions } from "@/pages/project/components/OverviewHeaderActions";
import { PanelCard } from "@/pages/project/components/PanelCard";
import { ProjectSlider } from "@/pages/project/components/ProjectSlider";
import { DailyCard } from "@/pages/project/components/DailyCard";
import { ProjectTrendChart } from "@/pages/project/components/ProjectTrendChart";
import { ModelViewer } from "@/components/model/ModelViewer";
import { GanttChart } from "@/components/plan/gantt/GanttChart";
import { NetworkDiagram } from "@/components/plan/network/NetworkDiagram";
import { TaskDetailDialog } from "@/components/plan/dialogs/TaskDetailDialog";
import {
  getProjectCostCurve,
  getProjectHeadcountCurve,
} from "@/services/schedulepro-service";
import { Skeleton } from "@/components/ui/skeleton";

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

export function Overview({ projectId: propsProjectId }: OverviewProps = {}) {
  const { id: paramProjectId } = useParams();
  const { currentProject, projects, addProject, setCurrentProject } = useProject();
  const requestedProjectRef = propsProjectId || paramProjectId || currentProject?.id || "";
  const { projectId: resolvedProjectId, coreGraph } = useProjectCoreGraph({
    projectId: requestedProjectRef,
  });

  const { tagMap, processHighlights, getIdsByDate } = useProjectHighlight(resolvedProjectId);
  const [isResizingModel, setIsResizingModel] = useState(false);
  const [modelPanelRatio, setModelPanelRatio] = useState(0.45);
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>({
    headcount: true,
    cost: true,
    gantt: true,
    network: true,
    model: true,
  });
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
  const overviewModels = useMemo(
    () => [
      {
        key: "default",
        src: "https://apmoss.emio.cn/public/models/0426.ifc",
        tagMap,
      },
    ],
    [tagMap],
  );
  const overviewBaseMaterialOverrides = useMemo(
    () => ({
      transparent: true,
      opacity: 0,
    }),
    [],
  );

  const planTasks = usePlanTasks(coreGraph);
  const {
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
  } = useOverviewTimeline(processHighlights);
  const { currentProjectName, totalDurationLabel, onsiteCount } = useOverviewMetrics({
    requestedProjectRef,
    resolvedProjectId,
    projects,
    currentProject,
    coreGraph,
  });
  const {
    isTaskDetailDialogOpen,
    setIsTaskDetailDialogOpen,
    selectedTaskForDetail,
    handleResetProject,
    handleTaskDetail,
    handleDailyProcessClick,
  } = useOverviewActions({
    resolvedProjectId,
    timeRange,
    planTasks,
    addProject,
    setCurrentProject,
  });

  const headcountCurveQuery = useQuery({
    queryKey: ["overview", "headcount-curve", resolvedProjectId],
    queryFn: async () => {
      if (!resolvedProjectId) {
        throw new Error("缺少项目 ID");
      }
      return getProjectHeadcountCurve(resolvedProjectId);
    },
    enabled: Boolean(resolvedProjectId),
    refetchOnWindowFocus: false,
  });

  const costCurveQuery = useQuery({
    queryKey: ["overview", "cost-curve", resolvedProjectId],
    queryFn: async () => {
      if (!resolvedProjectId) {
        throw new Error("缺少项目 ID");
      }
      return getProjectCostCurve(resolvedProjectId);
    },
    enabled: Boolean(resolvedProjectId),
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
        const normalized = Number.isFinite(rawCost) ? rawCost / unitMeta.divisor : 0;
        return {
          date: dates[index],
          总成本: Number(normalized.toFixed(2)),
        };
      }),
    };
  }, [costCurveQuery.data]);

  const { completedIds, inProgressIds } = useMemo(() => {
    if (!selectedTimelineDate) {
      return { completedIds: [], inProgressIds: [] };
    }
    const result = getIdsByDate(selectedTimelineDate);
    return {
      completedIds: result.completedIds,
      inProgressIds: result.inProgressIds,
    };
  }, [getIdsByDate, selectedTimelineDate]);
  const overviewHighlightColorGroups = useMemo(
    () => [
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
    ],
    [completedIds, fixedHighlightIds, inProgressIds],
  );
  const dailyProcesses = useDailyProcesses(processHighlights, planTasks, selectedTimelineDate);
  const dailyTaskNames = useMemo(() => {
    return [...dailyProcesses]
      .sort((a, b) => {
        const aSeq =
          typeof a.seqNo === "number" ? a.seqNo : Number(a.seqNo ?? Number.MAX_SAFE_INTEGER);
        const bSeq =
          typeof b.seqNo === "number" ? b.seqNo : Number(b.seqNo ?? Number.MAX_SAFE_INTEGER);
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
        const aSeq =
          typeof a.seqNo === "number" ? a.seqNo : Number(a.seqNo ?? Number.MAX_SAFE_INTEGER);
        const bSeq =
          typeof b.seqNo === "number" ? b.seqNo : Number(b.seqNo ?? Number.MAX_SAFE_INTEGER);
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
    progressStatus: timelineProgress < 33 ? "超前" : timelineProgress > 80 ? "滞后" : "符合计划",
    remark: "",
  });
  const showTrendPanels = panelVisibility.headcount || panelVisibility.cost;
  const showPlanPanels = panelVisibility.gantt || panelVisibility.network;
  const showModelPanel = panelVisibility.model;
  const hasUpperPanels = showTrendPanels || showPlanPanels;
  const trendVisibleCount = Number(panelVisibility.headcount) + Number(panelVisibility.cost);
  const planVisibleCount = Number(panelVisibility.gantt) + Number(panelVisibility.network);
  const leftColumnRef = useRef<HTMLDivElement | null>(null);
  const visiblePanelCount = useMemo(
    () => Object.values(panelVisibility).filter(Boolean).length,
    [panelVisibility],
  );
  const handleTogglePanel = (panel: keyof PanelVisibility) => {
    setPanelVisibility((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

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
      const clampedUpper = Math.min(Math.max(offsetY, minUpperPx), rect.height - minModelPx);
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

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 bg-transparent px-0 pt-0 pb-0 text-slate-100">
      <div className="shrink-0 rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)] px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/55">
              Project Overview
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-lg font-semibold text-white">{currentProjectName}</h1>
              {totalDurationLabel && (
                <span className="text-sm text-slate-400">总工期：{totalDurationLabel}</span>
              )}
              {typeof onsiteCount === "number" && (
                <span className="rounded-none border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  {onsiteCount} 人在场
                </span>
              )}
            </div>
          </div>

          <OverviewHeaderActions
            panelVisibility={panelVisibility}
            visiblePanelCount={visiblePanelCount}
            onResetProject={() => {
              void handleResetProject();
            }}
            onTogglePanel={handleTogglePanel}
            onExportWeekly={handleExportWeeklyDOC}
            onExportDaily={handleExportDailyDOC}
          />
        </div>
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
                        models={overviewModels}
                        baseMaterialOverrides={overviewBaseMaterialOverrides}
                        highlightColorGroups={overviewHighlightColorGroups}
                        className="h-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DailyCard items={dailyProcesses} onItemClick={handleDailyProcessClick} />
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
