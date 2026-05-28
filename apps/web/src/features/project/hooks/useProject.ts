import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useProjectStore } from "@/stores/projectStore";
import { getProjectList, getProjectMetrics } from "../services/project-api";
import { projectQueryKeys } from "../queryKeys";
import type { ProjectListItem, ProjectListParams } from "../types";

/**
 * 提供项目列表和当前项目的状态管理。
 * 使用 React Query 缓存项目列表，Zustand 持久化当前项目 ID。
 *
 * @param params - 项目列表筛选和分页参数
 * @returns 项目列表、当前项目和刷新动作
 */
export function useProject(params: ProjectListParams = {}) {
  const { id } = useParams();
  const { currentProjectId, setCurrentProjectId } = useProjectStore();

  const projectsQuery = useQuery({
    queryKey: projectQueryKeys.list(params),
    queryFn: () => getProjectList(params),
    refetchOnWindowFocus: false,
  });

  const projects = useMemo(() => projectsQuery.data?.items ?? [], [projectsQuery.data]);
  const currentProject = useMemo(
    () => projects.find((project) => project.id === currentProjectId) ?? null,
    [projects, currentProjectId],
  );

  // 路由同步：当 URL 中的项目 ID 变化时，自动切换当前项目
  useEffect(() => {
    if (id && projects.length > 0) {
      const project = projects.find((p) => p.id === id);
      if (project && project.id !== currentProjectId) {
        setCurrentProjectId(project.id);
      }
    }
  }, [id, projects, currentProjectId, setCurrentProjectId]);

  const wrappedRefreshProjects = async () => {
    await projectsQuery.refetch();
  };

  const setCurrentProject = (project: ProjectListItem | null) => {
    setCurrentProjectId(project?.id ?? null);
  };

  return {
    currentProject,
    currentProjectId,
    setCurrentProject,
    setCurrentProjectId,
    projects,
    total: projectsQuery.data?.total ?? projects.length,
    page: projectsQuery.data?.page ?? params.page ?? 1,
    pageSize: projectsQuery.data?.page_size ?? params.page_size ?? projects.length,
    refreshProjects: wrappedRefreshProjects,
    isLoading: projectsQuery.isLoading,
    isError: projectsQuery.isError,
    error: projectsQuery.error,
  };
}

/**
 * 获取项目控制台统计指标。
 *
 * @returns 项目统计查询状态和后端指标
 */
export function useProjectMetrics() {
  return useQuery({
    queryKey: projectQueryKeys.metrics,
    queryFn: getProjectMetrics,
    refetchOnWindowFocus: false,
  });
}
