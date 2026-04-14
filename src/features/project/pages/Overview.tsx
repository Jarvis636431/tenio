import { useState } from "react";
import {
  useProjectExport,
  useProjectData,
  useProjectCharts,
  ProjectTabBar,
  UploadsTab,
  ProjectScheduleTable,
} from "@/features/project";
import { OrganizationTab } from "../components/OrganizationTab";
import { RotationTab } from "../components/RotationTab";
import { TimeCostTab } from "../components/TimeCostTab";
import { GanttChart } from "@/components/chart/GanttChart";
import { NetworkDiagram } from "@/components/chart/NetworkDiagram";
import { Skeleton } from "@/components/ui/skeleton";

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
          <ProjectScheduleTable
            planTasks={planTasks}
            isLoading={isLoadingGraph}
            coreGraph={coreGraph}
          />
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
