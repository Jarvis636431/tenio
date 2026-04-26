import { listProjects } from "@/services/apm-api";
import { projectListResponseSchema } from "./project-schema";
import type { ProjectListResponse } from "@/features/project";
import type { ProjectListItem as ApmProjectListItem } from "@/services/apm-api";

// ============================================================================
// 项目列表与基础信息
// ============================================================================

function mapApmProjectListItem(item: ApmProjectListItem): ProjectListResponse[number] {
  return {
    project_id: item.project_id,
    project_name: item.project_name,
    description: item.location ?? item.project_type ?? item.status_label,
    status: item.status,
    created_at: item.created_at,
  };
}

/**
 * 获取项目列表。
 */
export async function getProjectList(): Promise<ProjectListResponse> {
  const response = await listProjects();
  return projectListResponseSchema.parse(response.items.map(mapApmProjectListItem));
}
