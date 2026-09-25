// Project Feature Module
// 项目相关功能统一导出

export { Overview } from "./pages/Overview";
export { default as ProjectsPage } from "./pages/Projects";

export { useProject, useProjectMetrics } from "./hooks/useProject";
export { useProjectExport } from "./hooks/useProjectExport";
export { useProjectData } from "./hooks/useProjectData";
export { projectQueryKeys } from "./queryKeys";

export { ProjectTabBar } from "./components/ProjectTabBar";
export { FileInfoTab } from "./components/FileInfoTab";
export { DocsTab } from "./components/DocsTab";
export { RotationTab } from "./components/RotationTab";
export { ChartTab } from "./components/ChartTab";
export { ProjectTable } from "./components/ProjectTable";
export { ProjectGenerationStatusDialog } from "./components/ProjectGenerationStatusDialog";

export {
  cancelProjectGeneration,
  deleteProject,
  getLatestCrewPlanArtifact,
  getLatestDocumentArtifact,
  getLatestGraphArtifact,
  getProjectMetrics,
  getProjectGenerationStatus,
  getProjectList,
  getProjectOperationStatus,
  getWorkbenchUploadSummary,
  regenerateProjectArtifacts,
  startProjectGeneration,
} from "./services/project-api";

export type {
  CrewPlanArtifact,
  DocumentArtifact,
  ProjectListItem,
  ProjectListParams,
  ProjectMetrics,
  GenerationStep,
  GenerationStatus,
  OperationStatus,
  RegeneratePayload,
  StartGenerationPayload,
  StartGenerationResponse,
  ScheduleArtifact,
  ScheduleTask,
  TimeCostArtifact,
  TimeCostOption,
  WorkbenchUploadSummary,
} from "./types";
