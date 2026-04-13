// Project Feature Module
// 项目相关功能统一导出

export { Overview } from "./pages/Overview";

export { useProject } from "./hooks/useProject";
export { useProjectExport } from "./hooks/useProjectExport";
export { useProjectCharts } from "./hooks/useProjectCharts";
export { useProjectData } from "./hooks/useProjectData";
export { projectQueryKeys } from "./queryKeys";

export { ProjectTrendChart } from "./components/ProjectTrendChart";
export { ProjectTabBar } from "./components/ProjectTabBar";
export { UploadsTab } from "./components/UploadsTab";

// Re-export from upload feature for backwards compatibility
export {
  useUploads,
  type UseUploadsReturn,
  uploadQueryKeys,
  getFileList,
  uploadFile,
  deleteFile,
  updateFile,
  getFileStats,
  getFileDownloadUrl,
  FILE_CATEGORY_LABELS,
  FILE_CATEGORY_ICONS,
  type FileCategory,
  type FileStatus,
  type ProjectFile,
  type FileUploadPayload,
  type FileUploadResponse,
  type FileListParams,
  type FileListResponse,
  type FileDeletePayload,
  type FileUpdatePayload,
  type FileCategoryStat,
  type FileStatsResponse,
} from "@/features/upload";

export {
  getProjectList,
  getProcessInfo,
  getProjectCoreGraph,
  getProjectCostCurve,
  getProjectHeadcountCurve,
  createJiuanProject,
  selectSolution,
} from "./services/project-api";

export type {
  Project,
  OrderInfoData,
  ProcessInfoResponse,
  ProjectListResponse,
  ProjectListItem,
} from "./types";
