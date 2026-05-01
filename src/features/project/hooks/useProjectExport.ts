import type { ScheduleArtifact } from "../types";

/**
 * 提供项目工作台导出动作。
 */
export function useProjectExport(_graphArtifact?: ScheduleArtifact) {
  const handleExport = () => {
    // TODO: 实现导出功能
    console.log("导出功能待实现");
  };

  return { handleExport };
}
