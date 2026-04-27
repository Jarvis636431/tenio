import { useCallback, useMemo, useState } from "react";
import {
  useProjectExport,
  useProjectData,
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

const PANEL_CLASS =
  "min-h-[360px] overflow-hidden border border-none bg-[rgba(2,12,27,0.6)] shadow-apm-panel px-4";
const EMPTY_PANEL_CLASS =
  "flex h-full min-h-[360px] items-center justify-center text-sm text-apm-muted";

export function Overview({ projectId: propsProjectId }: OverviewProps = {}) {
  const [activeTab, setActiveTab] = useState<OverviewTab>("chart");

  const {
    resolvedProjectId,
    scheduleArtifact,
    isLoadingGraph,
    planTasks,
    currentProjectName,
    totalDurationLabel,
    costQuery,
  } = useProjectData({ projectId: propsProjectId });

  const costCurveChart = costQuery.chartData;

  const { handleExport } = useProjectExport(scheduleArtifact);

  const handleRegenerate = useCallback(() => {
    alert("重新生成功能即将上线");
  }, []);

  const handleViewResults = useCallback(() => {
    setActiveTab("docs");
  }, []);

  const projectSummary = useMemo(
    () => ({
      projectName: currentProjectName,
      planTaskCount: planTasks.length,
      totalDurationLabel,
    }),
    [currentProjectName, planTasks.length, totalDurationLabel],
  );

  const chartPanel = useMemo(
    () => (
      <div className={PANEL_CLASS}>
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
          <div className={EMPTY_PANEL_CLASS}>暂无成本曲线数据</div>
        )}
      </div>
    ),
    [costQuery.isLoading, costCurveChart, totalDurationLabel, planTasks],
  );

  const uploadsPanel = useMemo(
    () => (
      <div className={PANEL_CLASS}>
        <div className="h-full min-h-[520px] p-4">
          <UploadsTab
            projectId={resolvedProjectId}
            projectSummary={projectSummary}
            onViewResults={handleViewResults}
          />
        </div>
      </div>
    ),
    [resolvedProjectId, projectSummary, handleViewResults],
  );

  const docsPanel = useMemo(
    () => (
      <div className={PANEL_CLASS}>
        <div className="h-full min-h-[520px] p-4">
          <DocsTab content="# 施工组织设计文档" />
        </div>
      </div>
    ),
    [],
  );

  const scheduleListPanel = useMemo(
    () => (
      <div className={`${PANEL_CLASS} min-h-[640px] overflow-auto`}>
        <ProjectTable planTasks={planTasks} isLoading={isLoadingGraph} />
      </div>
    ),
    [planTasks, isLoadingGraph],
  );

  const ganttPanel = useMemo(
    () => (
      <div className={`${PANEL_CLASS} min-h-[640px]`}>
        <GanttChart data={planTasks} scale="day" />
      </div>
    ),
    [planTasks],
  );

  const networkPanel = useMemo(
    () => (
      <div className={`${PANEL_CLASS} min-h-[640px]`}>
        <NetworkDiagram tasks={planTasks} />
      </div>
    ),
    [planTasks],
  );

  const rotationPanel = useMemo(
    () => (
      <div className={PANEL_CLASS}>
        <div className="h-full min-h-[520px] p-4">
          <RotationTab planTasks={planTasks} />
        </div>
      </div>
    ),
    [planTasks],
  );

  return (
    <div className="flex min-h-full flex-col gap-4 bg-transparent p-0 text-slate-100">
      <ProjectTabBar
        activeTab={activeTab}
        onChange={setActiveTab}
        onExport={handleExport}
        onRegenerate={handleRegenerate}
      />

      {activeTab === "chart" && chartPanel}
      {activeTab === "uploads" && uploadsPanel}
      {activeTab === "docs" && docsPanel}
      {activeTab === "scheduleList" && scheduleListPanel}
      {activeTab === "gantt" && ganttPanel}
      {activeTab === "network" && networkPanel}
      {activeTab === "rotation" && rotationPanel}
    </div>
  );
}
