import { useState } from "react";
import {
  useProjectExport,
  useProjectData,
  useProjectCharts,
  ProjectTabBar,
  UploadsTab,
  ProjectTable,
  DocsTab,
  ChartTab,
  RotationTab,
} from "@/features/project";
import { GanttChart } from "@/components/chart/GanttChart";
import { NetworkDiagram } from "@/components/chart/NetworkDiagram";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewProps {
  projectId?: string;
}

type OverviewTab = "chart" | "uploads" | "docs" | "scheduleList" | "gantt" | "network" | "rotation";

export function Overview({ projectId: propsProjectId }: OverviewProps = {}) {
  const [activeTab, setActiveTab] = useState<OverviewTab>("chart");

  const {
    resolvedProjectId,
    scheduleArtifact,
    isLoadingGraph,
    planTasks,
    currentProjectName,
    totalDurationLabel,
  } = useProjectData({ projectId: propsProjectId });

  const { costQuery } = useProjectCharts({
    projectId: resolvedProjectId,
  });

  const costCurveChart = costQuery.chartData;

  const { handleExport } = useProjectExport(scheduleArtifact);

  const panelClass =
    "min-h-[360px] overflow-hidden border border-none bg-[rgba(2,12,27,0.6)] shadow-apm-panel px-4";
  const emptyPanelClass =
    "flex h-full min-h-[360px] items-center justify-center text-sm text-apm-muted";

  return (
    <div className="flex min-h-full flex-col gap-4 bg-transparent p-0 text-slate-100">
      <ProjectTabBar
        activeTab={activeTab}
        onChange={setActiveTab}
        onExport={handleExport}
        onRegenerate={() => alert("重新生成功能即将上线")}
      />

      {activeTab === "chart" && (
        <div className={panelClass}>
          {costQuery.isLoading ? (
            <div className="flex h-[360px] items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : costCurveChart.points.length > 0 ? (
            <div className="h-full min-h-[520px] p-4">
              <ChartTab
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
              onViewResults={() => setActiveTab("docs")}
            />
          </div>
        </div>
      )}

      {activeTab === "docs" && (
        <div className={panelClass}>
          <div className="h-full min-h-[520px] p-4">
            <DocsTab content="# 施工组织设计文档" />
          </div>
        </div>
      )}

      {activeTab === "scheduleList" && (
        <div className={`${panelClass} min-h-[640px] overflow-auto`}>
          <ProjectTable planTasks={planTasks} isLoading={isLoadingGraph} />
        </div>
      )}

      {activeTab === "gantt" && (
        <div className={`${panelClass} min-h-[640px]`}>
          <GanttChart data={planTasks} scale="day" />
        </div>
      )}

      {activeTab === "network" && (
        <div className={`${panelClass} min-h-[640px]`}>
          <NetworkDiagram tasks={planTasks} />
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
