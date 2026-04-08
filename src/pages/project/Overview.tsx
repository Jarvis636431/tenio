import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useProjectCoreGraph } from "@/hooks/useProjectCoreGraph";
import { useProjectHighlight } from "@/hooks/useProjectHighlight";
import { useProject } from "@/hooks/useProject";
import { formatDate, formatIsoDate } from "@/lib/date";
import { useProjectExport } from "@/pages/project/hooks/useProjectExport";
import { useOverviewActions } from "@/pages/project/hooks/useOverviewActions";
import { usePlanTasks } from "@/pages/project/hooks/usePlanTasks";
import { useDailyProcesses } from "@/pages/project/hooks/useDailyProcesses";
import { useOverviewMetrics } from "@/pages/project/hooks/useOverviewMetrics";
import { useOverviewTimeline } from "@/pages/project/hooks/useOverviewTimeline";
import { OverviewHeaderActions } from "@/pages/project/components/OverviewHeaderActions";
import { sortBySeqNo } from "@/lib/array";
import { ProjectSlider } from "@/pages/project/components/ProjectSlider";
import { ProjectTrendChart } from "@/pages/project/components/ProjectTrendChart";
import { ProjectTabBar } from "@/pages/project/components/ProjectTabBar";
import { GanttChart } from "@/components/chart/GanttChart";
import { NetworkDiagram } from "@/components/chart/NetworkDiagram";
import { TaskDetailDialog } from "@/components/chart/TaskDetailDialog";
import { getProjectCostCurve, getProjectHeadcountCurve } from "@/services/schedulepro-service";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewProps {
  projectId?: string;
  projectName?: string;
}

type OverviewTab =
  | "overview"
  | "schedule"
  | "network"
  | "resources"
  | "uploads"
  | "organization"
  | "rotation";

export function Overview({ projectId: propsProjectId }: OverviewProps = {}) {
  const { id: paramProjectId } = useParams();
  const { currentProject, projects, addProject, setCurrentProject } = useProject();
  const requestedProjectRef = propsProjectId || paramProjectId || currentProject?.id || "";
  const { projectId: resolvedProjectId, coreGraph } = useProjectCoreGraph({
    projectId: requestedProjectRef,
  });

  const { processHighlights } = useProjectHighlight(resolvedProjectId);
  const [activeTab, setActiveTab] = useState<OverviewTab>("overview");

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

  const processTableRows = useMemo(() => sortBySeqNo(planTasks), [planTasks]);

  const dailyProcesses = useDailyProcesses(processHighlights, planTasks, selectedTimelineDate);
  const dailyTaskNames = useMemo(
    () => sortBySeqNo(dailyProcesses).map((item) => item.name),
    [dailyProcesses],
  );
  const dailyDateText = useMemo(() => {
    return formatDate(selectedTimelineDate, "yyyy/mm/dd");
  }, [selectedTimelineDate]);
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

  const formatDateTime = (value?: string) => formatIsoDate(value, true);

  return (
    <div className="flex min-h-full flex-col gap-3 bg-transparent px-0 pt-0 pb-0 text-slate-100">
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
            onResetProject={() => {
              void handleResetProject();
            }}
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
        <div className="min-h-[520px] overflow-auto rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)]">
          {processTableRows.length === 0 ? (
            <div className="flex h-full min-h-[520px] items-center justify-center text-cyan-300/70">
              当前项目暂无工序数据
            </div>
          ) : (
            <div className="min-w-[840px]">
              <div className="grid grid-cols-[96px_minmax(220px,1fr)_180px_180px_120px] border-b border-cyan-400/12 bg-[rgba(2,12,27,0.74)] px-4 py-3 text-xs font-semibold text-cyan-200">
                <span>序号</span>
                <span>工序名称</span>
                <span>开始时间</span>
                <span>结束时间</span>
                <span>关键线路</span>
              </div>
              {processTableRows.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleTaskDetail(task)}
                  className="grid w-full grid-cols-[96px_minmax(220px,1fr)_180px_180px_120px] items-center border-b border-cyan-400/10 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-[rgba(8,34,67,0.72)]"
                >
                  <span className="text-cyan-300/70">{task.seqNo ?? "-"}</span>
                  <span className="truncate pr-4">{task.task}</span>
                  <span className="text-slate-300">{formatDateTime(task.startTime)}</span>
                  <span className="text-slate-300">{formatDateTime(task.endTime)}</span>
                  <span>
                    <span
                      className={`inline-flex min-w-[68px] items-center justify-center rounded-none border px-2 py-1 text-xs ${
                        task.criticalPath
                          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                          : "border-slate-500/25 bg-slate-500/10 text-slate-300"
                      }`}
                    >
                      {task.criticalPath ? "是" : "否"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="min-h-[640px] overflow-hidden rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)]">
          {planTasks.length === 0 ? (
            <div className="flex h-full min-h-[640px] items-center justify-center text-cyan-300/70">
              当前项目暂无施工任务数据
            </div>
          ) : (
            <GanttChart
              data={planTasks}
              onTaskDetail={handleTaskDetail}
              scale="day"
              currentDate={selectedTimelineDate}
            />
          )}
        </div>
      )}

      {activeTab === "network" && (
        <div className="min-h-[640px] overflow-hidden rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)]">
          {planTasks.length === 0 ? (
            <div className="flex h-full min-h-[640px] items-center justify-center text-cyan-300/70">
              当前项目暂无施工任务数据
            </div>
          ) : (
            <NetworkDiagram
              tasks={planTasks}
              onNodeClick={handleTaskDetail}
              currentDate={selectedTimelineDate}
            />
          )}
        </div>
      )}

      {activeTab === "resources" && (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <div className="min-h-[360px] overflow-hidden rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)] p-4">
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
          </div>

          <div className="min-h-[360px] overflow-hidden rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)] p-4">
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
          </div>
        </div>
      )}

      {(activeTab === "uploads" || activeTab === "organization" || activeTab === "rotation") && (
        <div className="min-h-[360px] rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)] px-6 py-8 text-sm text-slate-300">
          <p>当前版本暂未接入此功能。</p>
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
