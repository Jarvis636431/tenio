import { useCallback, useMemo, useState } from "react";
import { GanttChart } from "@/components/chart/GanttChart";
import { NetworkDiagram } from "@/components/chart/NetworkDiagram";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartTab } from "../components/ChartTab";
import { DocsTab } from "../components/DocsTab";
import { ProjectTabBar } from "../components/ProjectTabBar";
import { ProjectTable } from "../components/ProjectTable";
import { RotationTab } from "../components/RotationTab";
import { FileInfoTab } from "../components/FileInfoTab";
import { useProjectData } from "../hooks/useProjectData";
import { useProjectExport } from "../hooks/useProjectExport";

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
    graphArtifact,
    isLoadingGraph,
    planTasks,
    currentProjectName,
    totalDurationLabel,
    costQuery,
    documentQuery,
    documentArtifact,
    documentContent,
    crewPlanQuery,
    crewPlanArtifact,
  } = useProjectData({ projectId: propsProjectId });

  const costCurveChart = costQuery.chartData;

  const { handleExport } = useProjectExport(graphArtifact);

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
              timeCostArtifact={costQuery.data}
            />
          </div>
        ) : (
          <div className={EMPTY_PANEL_CLASS}>暂无成本曲线数据</div>
        )}
      </div>
    ),
    [costQuery.isLoading, costQuery.data, costCurveChart, totalDurationLabel, planTasks],
  );

  const uploadsPanel = useMemo(
    () => (
      <div className={PANEL_CLASS}>
        <div className="h-full min-h-[520px] p-4">
          <FileInfoTab
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
        {documentQuery.isLoading ? (
          <div className="flex h-[520px] items-center justify-center p-4">
            <Skeleton className="h-full w-full" />
          </div>
        ) : documentContent.trim() ? (
          <div className="h-full min-h-[520px] p-4">
            <DocsTab content={documentContent} artifact={documentArtifact} />
          </div>
        ) : (
          <div className={EMPTY_PANEL_CLASS}>暂无施工组织设计文档</div>
        )}
      </div>
    ),
    [documentQuery.isLoading, documentContent, documentArtifact],
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
          <RotationTab crewPlanArtifact={crewPlanArtifact} isLoading={crewPlanQuery.isLoading} />
        </div>
      </div>
    ),
    [crewPlanArtifact, crewPlanQuery.isLoading],
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
