import { useState } from "react";
import { formatIsoDate } from "@/lib/date";
import { sortBySeqNo } from "@/lib/array";
import { useProjectExport } from "../hooks/useProjectExport";
import { useProjectData } from "../hooks/useProjectData";
import { useProjectCharts } from "../hooks/useProjectCharts";
import { ProjectTrendChart } from "../components/ProjectTrendChart";
import { ProjectTabBar } from "../components/ProjectTabBar";
import { UploadsTab } from "../components/UploadsTab";
import { GanttChart } from "@/components/chart/GanttChart";
import { NetworkDiagram } from "@/components/chart/NetworkDiagram";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverviewProps {
  projectId?: string;
  projectName?: string;
}

type OverviewTab =
  | "uploads"
  | "organization"
  | "schedule"
  | "overview"
  | "network"
  | "rotation"
  | "resources";

export function Overview({ projectId: propsProjectId }: OverviewProps = {}) {
  const [activeTab, setActiveTab] = useState<OverviewTab>("uploads");

  const {
    resolvedProjectId,
    coreGraph,
    isLoadingGraph,
    planTasks,
    currentProjectName,
    totalDurationLabel,
    onsiteCount,
  } = useProjectData({ projectId: propsProjectId });

  const { headcountQuery, costQuery } = useProjectCharts({
    projectId: resolvedProjectId,
  });

  const headcountChartData = headcountQuery.chartData;
  const costCurveChart = costQuery.chartData;

  const { handleExport } = useProjectExport(coreGraph);

  const processTableRows = sortBySeqNo(planTasks);
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

          <Button
            type="button"
            size="sm"
            className="h-9 rounded-none border border-cyan-400/20 bg-[rgba(4,18,37,0.86)] px-3 text-cyan-100 transition hover:border-cyan-300/35 hover:bg-[rgba(8,34,67,0.92)]"
            onClick={handleExport}
          >
            <Download className="mr-1.5 h-4 w-4" />
            导出
          </Button>
        </div>
      </div>

      <ProjectTabBar activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "uploads" && <UploadsTab projectId={resolvedProjectId} />}

      {activeTab === "organization" && (
        <div className="min-h-[360px] rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)] px-6 py-8 text-sm text-slate-300">
          <p>当前版本暂未接入此功能。</p>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="min-h-[640px] overflow-hidden rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)]">
          {planTasks.length === 0 ? (
            <div className="flex h-full min-h-[640px] items-center justify-center text-cyan-300/70">
              {isLoadingGraph ? "加载中..." : "当前项目暂无施工任务数据"}
            </div>
          ) : (
            <GanttChart data={planTasks} scale="day" />
          )}
        </div>
      )}

      {activeTab === "overview" && (
        <div className="min-h-[520px] overflow-auto rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)]">
          {processTableRows.length === 0 ? (
            <div className="flex h-full min-h-[520px] items-center justify-center text-cyan-300/70">
              {isLoadingGraph ? "加载中..." : "当前项目暂无工序数据"}
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
                <div
                  key={task.id}
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "network" && (
        <div className="min-h-[640px] overflow-hidden rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)]">
          {planTasks.length === 0 ? (
            <div className="flex h-full min-h-[640px] items-center justify-center text-cyan-300/70">
              {isLoadingGraph ? "加载中..." : "当前项目暂无施工任务数据"}
            </div>
          ) : (
            <NetworkDiagram tasks={planTasks} />
          )}
        </div>
      )}

      {activeTab === "rotation" && (
        <div className="min-h-[360px] rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)] px-6 py-8 text-sm text-slate-300">
          <p>当前版本暂未接入此功能。</p>
        </div>
      )}

      {activeTab === "resources" && (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <div className="min-h-[360px] overflow-hidden rounded-none border border-cyan-400/15 bg-[rgba(4,18,37,0.82)] p-4">
            {headcountQuery.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : headcountQuery.isError ? (
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
            {costQuery.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : costQuery.isError ? (
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
    </div>
  );
}
