import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useProjectStore } from "@/stores/projectStore";
import { getProjectList } from "../services/project-api";
import { projectQueryKeys } from "../queryKeys";
import type { ProjectListItem } from "../types";

/**
 * 提供项目列表和当前项目的状态管理。
 * 使用 React Query 缓存项目列表，Zustand 持久化当前项目 ID。
 */
export function useProject() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { currentProjectId, setCurrentProjectId } = useProjectStore();

  const projectsQuery = useQuery({
    queryKey: projectQueryKeys.list,
    queryFn: getProjectList,
    refetchOnWindowFocus: false,
  });

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const currentProject = useMemo(
    () => projects.find((project) => project.project_id === currentProjectId) ?? null,
    [projects, currentProjectId],
  );

  // 路由同步：当 URL 中的项目 ID 变化时，自动切换当前项目
  useEffect(() => {
    if (id && projects.length > 0) {
      const project = projects.find((p) => p.project_id === id);
      if (project && project.project_id !== currentProjectId) {
        setCurrentProjectId(project.project_id);
      }
    }
  }, [id, projects, currentProjectId, setCurrentProjectId]);

  const wrappedRefreshProjects = async () => {
    await projectsQuery.refetch();
  };

  const setCurrentProject = (project: ProjectListItem | null) => {
    setCurrentProjectId(project?.project_id ?? null);
  };

  const addProject = (project: ProjectListItem) => {
    queryClient.setQueryData<ProjectListItem[]>(projectQueryKeys.list, (previous = []) => {
      const existing = previous.find((item) => item.project_id === project.project_id);
      if (existing) {
        return previous.map((item) =>
          item.project_id === project.project_id ? { ...item, ...project } : item,
        );
      }
      return [...previous, project];
    });
  };

  const updateProject = (updatedProject: ProjectListItem) => {
    queryClient.setQueryData<ProjectListItem[]>(projectQueryKeys.list, (previous = []) =>
      previous.map((item) =>
        item.project_id === updatedProject.project_id ? { ...item, ...updatedProject } : item,
      ),
    );
  };

  return {
    currentProject,
    currentProjectId,
    setCurrentProject,
    setCurrentProjectId,
    projects,
    addProject,
    updateProject,
    refreshProjects: wrappedRefreshProjects,
    isLoading: projectsQuery.isLoading,
  };
}
