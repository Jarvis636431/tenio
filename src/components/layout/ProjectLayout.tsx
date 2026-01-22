import { Outlet, useParams } from "react-router-dom";
import { useProject } from "@/hooks/useProject";
import { useProjectSchedule } from "@/hooks/useProjectSchedule";
import { PageHeader } from "@/components/layout/PageHeader";
import type { ProjectInfoRow } from "@/types/domain/project";
import { useMemo } from "react";

export function ProjectLayout() {
  const { id } = useParams();
  const { projects } = useProject();
  const { projectInfo } = useProjectSchedule();
  const currentProject = projects.find((p) => p.id === id);

  // 总工期标签逻辑（从 ProjectDetail 移过来）
  const totalDurationLabel = useMemo(() => {
    if (!projectInfo || projectInfo.length === 0) return "";

    const totalDurationRow = projectInfo.find((row: ProjectInfoRow) => {
      const label = row["项目信息"] ?? row["项目统计"];
      return typeof label === "string" && label.includes("总工期");
    });

    if (!totalDurationRow) return "";

    const valueKey = Object.keys(totalDurationRow).find((key) => {
      if (
        key === "项目信息" ||
        key === "项目统计" ||
        key.toLowerCase().includes("index")
      ) {
        return false;
      }
      const value = totalDurationRow[key];
      return (
        value !== undefined && value !== null && String(value).trim() !== ""
      );
    });

    if (!valueKey) return "";
    const value = totalDurationRow[valueKey];
    return typeof value === "string"
      ? value.trim()
      : String(value ?? "").trim();
  }, [projectInfo]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="px-6 pt-6">
        <PageHeader
          title={currentProject?.name || "项目详情"}
          titleExtra={
            totalDurationLabel ? `总工期：${totalDurationLabel}` : undefined
          }
        />
      </div>

      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="h-full overflow-auto">
          <Outlet /> {/* React Router 自动渲染匹配的子路由 */}
        </div>
      </div>
    </div>
  );
}
