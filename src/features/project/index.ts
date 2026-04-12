// Project Feature Module
// 项目相关功能统一导出

export { Overview } from "./pages/Overview";

export { useProject } from "./hooks/useProject";
export { useProjectCharts } from "./hooks/useProjectCharts";
export { useProjectData } from "./hooks/useProjectData";
export { useUploads, type UseUploadsReturn } from "./hooks/useUploads";
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
export {
  getFileList,
  uploadFile,
  deleteFile,
  updateFile,
  getFileStats,
  getFileDownloadUrl,
} from "./services/uploads-api";

export type {
  Project,
  OrderInfoData,
  ProcessInfoResponse,
  ProjectListResponse,
  ProjectListItem,
} from "./types";
export type {
  FileCategory,
  FileStatus,
  ProjectFile,
  FileUploadPayload,
  FileUploadResponse,
  FileListParams,
  FileListResponse,
  FileDeletePayload,
  FileUpdatePayload,
  FileCategoryStat,
  FileStatsResponse,
} from "./types/uploads";
export { FILE_CATEGORY_LABELS, FILE_CATEGORY_ICONS } from "./types/uploads";
