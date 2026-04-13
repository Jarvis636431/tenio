// Upload Feature Module
// 文件上传与项目管理入口功能

export { default as UploadPage } from "./pages/UploadPage";

export { useUploads, type UseUploadsReturn } from "./hooks/useUploads";
export { uploadQueryKeys } from "./queryKeys";

export {
  getFileList,
  uploadFile,
  deleteFile,
  updateFile,
  getFileStats,
  getFileDownloadUrl,
} from "./services/uploads-api";

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
