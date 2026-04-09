import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useProjectStore } from "@/stores/projectStore";
import { getProjectList } from "../services/project-api";
import type { Project, ProjectListItem, ProjectListResponse } from "../types";
import { projectQueryKeys } from "../queryKeys";

function mapProjectList(response: ProjectListResponse): Project[] {
  return response.map((item) => ({
    id: item.project_id,
    name: item.project_name,
    description: item.description,
    status: item.status,
    createdAt: item.created_at,
  }));
}

/**
 * 兼容原有 ProjectContext 的 hook
 * 提供相同的 API，但使用 Zustand 作为底层实现
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

  const projects = useMemo(() => mapProjectList(projectsQuery.data ?? []), [projectsQuery.data]);
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

  const setCurrentProject = (project: Project | null) => {
    setCurrentProjectId(project?.id ?? null);
  };

  const addProject = (project: Project) => {
    queryClient.setQueryData<ProjectListResponse>(projectQueryKeys.list, (previous = []) => {
      const nextItem: ProjectListItem = {
        project_id: project.id,
        project_name: project.name,
        description: project.description,
        status: project.status ?? "",
        created_at: project.createdAt ?? new Date().toISOString(),
      };
      const existing = previous.find((item) => item.project_id === project.id);
      if (existing) {
        return previous.map((item) =>
          item.project_id === project.id ? { ...item, ...nextItem } : item,
        );
      }
      return [...previous, nextItem];
    });
  };

  const updateProject = (updatedProject: Project) => {
    queryClient.setQueryData<ProjectListResponse>(projectQueryKeys.list, (previous = []) =>
      previous.map((item) =>
        item.project_id === updatedProject.id
          ? {
              ...item,
              project_name: updatedProject.name,
              description: updatedProject.description,
              status: updatedProject.status ?? item.status,
              created_at: updatedProject.createdAt ?? item.created_at,
            }
          : item,
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
