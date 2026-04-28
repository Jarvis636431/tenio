// Project Feature Module
// 项目相关功能统一导出

export { Overview } from "./pages/Overview";
export { default as ProjectsPage } from "./pages/Projects";

export { useProject, useProjectMetrics } from "./hooks/useProject";
export { useProjectExport } from "./hooks/useProjectExport";
export { useProjectData } from "./hooks/useProjectData";
export { projectQueryKeys } from "./queryKeys";

export { ProjectTabBar } from "./components/ProjectTabBar";
export { UploadsTab } from "./components/UploadsTab";
export { DocsTab } from "./components/DocsTab";
export { RotationTab } from "./components/RotationTab";
export { ChartTab } from "./components/ChartTab";
export { ProjectTable } from "./components/ProjectTable";

export {
  getProjectMetrics,
  getProjectGenerationStatus,
  getProjectList,
  startProjectGeneration,
} from "./services/project-api";

export type {
  ProjectListItem,
  ProjectListParams,
  ProjectMetrics,
  GenerationStep,
  GenerationStatus,
  StartGenerationResponse,
  ScheduleTask,
  TimeCostOption,
} from "./types";
