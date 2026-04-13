import { useState } from "react";
import { formatIsoDate } from "@/lib/date";
import { sortBySeqNo } from "@/lib/array";
import {
  useProjectExport,
  useProjectData,
  useProjectCharts,
  ProjectTabBar,
  UploadsTab,
} from "@/features/project";
import { OrganizationTab } from "../components/OrganizationTab";
import { RotationTab } from "../components/RotationTab";
import { TimeCostTab } from "../components/TimeCostTab";
import { GanttChart } from "@/components/chart/GanttChart";
import { NetworkDiagram } from "@/components/chart/NetworkDiagram";
import { Skeleton } from "@/components/ui/skeleton";
import type { CoreGraphResponse } from "@/types/domain/schedulepro";

interface OverviewProps {
  projectId?: string;
}

type OverviewTab =
  | "timeCost"
  | "uploads"
  | "organization"
  | "scheduleList"
  | "gantt"
  | "network"
  | "rotation";

function normalizeStatusChip(status?: string) {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("完成") || s.includes("done") || s.includes("end")) return "done";
  if (s.includes("进行") || s.includes("active") || s.includes("start")) return "act";
  return "pend";
}

function resolveOutlineLevel(wp: CoreGraphResponse["work_processes"][number]): number {
  const meta = wp.outline_metadata;
  if (meta && typeof meta.level === "number") return meta.level;
  return wp.outline_level ?? 0;
}

export function Overview({ projectId: propsProjectId }: OverviewProps = {}) {
  const [activeTab, setActiveTab] = useState<OverviewTab>("timeCost");

  const {
    resolvedProjectId,
    coreGraph,
    isLoadingGraph,
    planTasks,
    currentProjectName,
    totalDurationLabel,
  } = useProjectData({ projectId: propsProjectId });

  const { costQuery } = useProjectCharts({
    projectId: resolvedProjectId,
  });

  const costCurveChart = costQuery.chartData;

  const { handleExport } = useProjectExport(coreGraph);

  const processTableRows = sortBySeqNo(planTasks);
  const formatDateTime = (value?: string) => formatIsoDate(value, true);
  const panelClass =
    "apm-topline min-h-[360px] overflow-hidden border border-apm bg-apm-card shadow-apm-panel";
  const emptyPanelClass =
    "flex h-full min-h-[360px] items-center justify-center text-sm text-apm-muted";

  return (
    <div className="flex min-h-full flex-col gap-4 bg-transparent px-0 pt-0 pb-0 text-slate-100">
      <ProjectTabBar
        activeTab={activeTab}
        onChange={setActiveTab}
        onExport={handleExport}
        onRegenerate={() => alert("重新生成功能即将上线")}
      />

      {activeTab === "timeCost" && (
        <div className={panelClass}>
          {costQuery.isLoading ? (
            <div className="flex h-[360px] items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : costCurveChart.points.length > 0 ? (
            <div className="h-full min-h-[520px] p-4">
              <TimeCostTab
                totalDurationLabel={totalDurationLabel}
                planTasks={planTasks}
                costCurveData={costCurveChart.points}
                unit={costCurveChart.unit}
              />
            </div>
          ) : (
            <div className={emptyPanelClass}>暂无成本曲线数据</div>
          )}
        </div>
      )}

      {activeTab === "uploads" && (
        <div className={panelClass}>
          <div className="h-full min-h-[520px] p-4">
            <UploadsTab
              projectId={resolvedProjectId}
              projectSummary={{
                projectName: currentProjectName,
                planTaskCount: planTasks.length,
                totalDurationLabel,
              }}
              onViewResults={() => setActiveTab("organization")}
            />
          </div>
        </div>
      )}

      {activeTab === "organization" && (
        <div className={panelClass}>
          <div className="h-full min-h-[520px] p-4">
            <OrganizationTab
              projectName={currentProjectName}
              planTasks={planTasks}
              totalDurationLabel={totalDurationLabel}
            />
          </div>
        </div>
      )}

      {activeTab === "scheduleList" && (
        <div className={`${panelClass} min-h-[640px] overflow-auto`}>
          {planTasks.length === 0 ? (
            <div className={emptyPanelClass}>
              {isLoadingGraph ? "加载中..." : "当前项目暂无施工任务数据"}
            </div>
          ) : (
            <div className="min-w-[900px]">
              <table className="w-full border-collapse text-[12px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[rgba(0,18,50,0.97)]">
                    <th className="w-[50px] border-b border-cyan-400/18 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
                      序号
                    </th>
                    <th className="border-b border-cyan-400/18 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
                      工序名称
                    </th>
                    <th className="w-[80px] border-b border-cyan-400/18 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
                      工期
                    </th>
                    <th className="w-[130px] border-b border-cyan-400/18 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
                      开始时间
                    </th>
                    <th className="w-[130px] border-b border-cyan-400/18 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
                      结束时间
                    </th>
                    <th className="w-[100px] border-b border-cyan-400/18 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
                      前置任务
                    </th>
                    <th className="w-[90px] border-b border-cyan-400/18 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-cyan-400/55">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processTableRows.map((task, idx) => {
                    const wp = coreGraph?.work_processes?.find((w) => w.id === task.id);
                    const level = resolveOutlineLevel(wp);
                    const isSum = level === 0 || level === 1;
                    const chipType = normalizeStatusChip(task.constructionSituation);
                    return (
                      <tr
                        key={task.id}
                        className={`border-b border-cyan-400/[0.04] transition hover:bg-cyan-400/[0.025] ${
                          isSum ? "bg-[rgba(0,28,60,0.5)]" : ""
                        }`}
                      >
                        <td
                          className={`px-3 py-2 text-center text-[10px] text-apm-dim ${
                            isSum ? "font-semibold text-white" : ""
                          }`}
                        >
                          {task.seqNo ?? idx + 1}
                        </td>
                        <td
                          className={`px-3 py-2 ${
                            level === 1 ? "pl-6" : level >= 2 ? "pl-10" : ""
                          } ${isSum ? "font-semibold text-white" : "text-[rgba(200,215,235,0.72)]"}`}
                        >
                          {task.criticalPath && !isSum && (
                            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" />
                          )}
                          {task.task}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-block border border-cyan-400/14 bg-cyan-400/[0.07] px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400">
                            {task.duration || "—"}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-2 text-slate-300 ${
                            isSum ? "font-semibold text-white" : ""
                          }`}
                        >
                          {formatDateTime(task.startTime)}
                        </td>
                        <td
                          className={`px-3 py-2 text-slate-300 ${
                            isSum ? "font-semibold text-white" : ""
                          }`}
                        >
                          {formatDateTime(task.endTime)}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-apm-dim">
                          {task.prerequisiteProcess || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 border px-1.5 py-0.5 text-[10px] font-medium ${
                              chipType === "done"
                                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                : chipType === "act"
                                  ? "border-cyan-400/18 bg-cyan-400/[0.07] text-cyan-300"
                                  : "border-amber-400/20 bg-amber-400/[0.08] text-amber-300"
                            }`}
                          >
                            {chipType === "done"
                              ? "已完成"
                              : chipType === "act"
                                ? "进行中"
                                : "待开始"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "gantt" && (
        <div className={`${panelClass} min-h-[640px]`}>
          {planTasks.length === 0 ? (
            <div className="flex h-full min-h-[640px] items-center justify-center text-cyan-300/70">
              {isLoadingGraph ? "加载中..." : "当前项目暂无施工任务数据"}
            </div>
          ) : (
            <GanttChart data={planTasks} scale="day" />
          )}
        </div>
      )}

      {activeTab === "network" && (
        <div className={`${panelClass} min-h-[640px]`}>
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
        <div className={panelClass}>
          <div className="h-full min-h-[520px] p-4">
            <RotationTab planTasks={planTasks} />
          </div>
        </div>
      )}
    </div>
  );
}
