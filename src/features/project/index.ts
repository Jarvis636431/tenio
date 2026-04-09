// Project Feature Module
// 项目相关功能统一导出

export { Overview } from "./pages/Overview";

export { useProject } from "./hooks/useProject";
export { useProjectCharts } from "./hooks/useProjectCharts";
export { useProjectData } from "./hooks/useProjectData";
export { projectQueryKeys } from "./queryKeys";

export {
  getProjectList,
  getProcessInfo,
  getProjectCoreGraph,
  getProjectCostCurve,
  getProjectHeadcountCurve,
  createJiuanProject,
  selectSolution,
} from "./services/project-api";
export { createProjectWithDefaultSolution } from "./services/project-bootstrap";

export type {
  Project,
  OrderInfoData,
  ProcessInfoResponse,
  ProjectListResponse,
  ProjectListItem,
} from "./types";
