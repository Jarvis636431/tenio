import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProjectStore } from "@/stores/projectStore";

let hasInitializedProjects = false;

/**
 * 兼容原有 ProjectContext 的 hook
 * 提供相同的 API，但使用 Zustand 作为底层实现
 */
export function useProject() {
  const { id } = useParams();

  const {
    currentProject,
    projects,
    isLoading,
    coreGraphByProjectId,
    setCurrentProject,
    addProject,
    updateProject,
    setCoreGraph,
    refreshProjects,
    setLoading,
  } = useProjectStore();

  // 初始化：首次加载时刷新项目列表
  useEffect(() => {
    let active = true;

    const fetchProjects = async () => {
      if (hasInitializedProjects) {
        return;
      }
      hasInitializedProjects = true;

      setLoading(true);
      try {
        await refreshProjects();
      } catch (error) {
        hasInitializedProjects = false;
        throw error;
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchProjects();

    return () => {
      active = false;
    };
  }, [refreshProjects, setLoading]);

  // 路由同步：当 URL 中的项目 ID 变化时，自动切换当前项目
  useEffect(() => {
    if (id && projects.length > 0) {
      const project = projects.find((p) => p.id === id);
      if (project && project.id !== currentProject?.id) {
        setCurrentProject(project);
      }
    }
  }, [id, projects, currentProject, setCurrentProject]);

  const wrappedRefreshProjects = async () => {
    await refreshProjects();
  };

  return {
    currentProject,
    setCurrentProject,
    projects,
    addProject,
    updateProject,
    refreshProjects: wrappedRefreshProjects,
    isLoading,
    coreGraphByProjectId,
    setCoreGraph,
  };
}
