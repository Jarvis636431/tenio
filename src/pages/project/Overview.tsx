import { useMemo, useState } from "react";
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
import { ProjectTrendChart } from "@/pages/project/components/ProjectTrendChart";
import { ProjectTabBar } from "@/pages/project/components/ProjectTabBar";
import { GanttChart } from "@/components/plan/gantt/GanttChart";
import { NetworkDiagram } from "@/components/plan/network/NetworkDiagram";
import { TaskDetailDialog } from "@/components/plan/dialogs/TaskDetailDialog";
import { getProjectCostCurve, getProjectHeadcountCurve } from "@/services/schedulepro-service";
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
};

type OverviewTab = "overview" | "schedule" | "network" | "resources";

export function Overview({ projectId: propsProjectId }: OverviewProps = {}) {
  const { id: paramProjectId } = useParams();
  const { currentProject, projects, addProject, setCurrentProject } = useProject();
  const requestedProjectRef = propsProjectId || paramProjectId || currentProject?.id || "";
  const { projectId: resolvedProjectId, coreGraph } = useProjectCoreGraph({
    projectId: requestedProjectRef,
  });

  const { processHighlights } = useProjectHighlight(resolvedProjectId);
  const [activeTab, setActiveTab] = useState<OverviewTab>("overview");
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>({
    headcount: true,
    cost: true,
    gantt: true,
    network: true,
  });

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
  const visiblePanelCount = useMemo(
    () => Object.values(panelVisibility).filter(Boolean).length,
    [panelVisibility],
  );
  const handleTogglePanel = (panel: keyof PanelVisibility) => {
    setPanelVisibility((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 bg-transparent px-0 pt-0 pb-0 text-slate-100">
      <div className="shrink-0 rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)] px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
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

      <ProjectTabBar activeTab={activeTab} onChange={setActiveTab} />

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

      {activeTab === "overview" && (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {showTrendPanels && (
            <div className="grid min-h-0 min-w-0 grid-cols-1 gap-2 lg:grid-cols-2">
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
            <div className="grid min-h-0 min-w-0 grid-cols-1 gap-2 lg:grid-cols-2">
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

      {activeTab === "schedule" && (
        <div className="min-h-0 flex-1 overflow-hidden">
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
        </div>
      )}

      {activeTab === "network" && (
        <div className="min-h-0 flex-1 overflow-hidden">
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
        </div>
      )}

      {activeTab === "resources" && (
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-hidden">
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
