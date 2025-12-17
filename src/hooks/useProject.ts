import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { useAuth } from '@/hooks/useAuth';

/**
 * 兼容原有 ProjectContext 的 hook
 * 提供相同的 API，但使用 Zustand 作为底层实现
 */
export function useProject() {
  const { id } = useParams();
  const { token, user } = useAuth();
  
  const {
    currentProject,
    projects,
    isLoading,
    setCurrentProject,
    addProject,
    updateProject,
    refreshProjects,
    setLoading,
  } = useProjectStore();

  // 初始化：当 token 或 user 变化时刷新项目列表
  useEffect(() => {
    let active = true;

    const fetchProjects = async () => {
      if (!token || !user?.id) {
        useProjectStore.getState().reset();
        return;
      }

      setLoading(true);
      try {
        await refreshProjects(token, user.id);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProjects();

    return () => {
      active = false;
    };
  }, [token, user?.id, refreshProjects, setLoading]);

  // 路由同步：当 URL 中的项目 ID 变化时，自动切换当前项目
  useEffect(() => {
    if (id && projects.length > 0) {
      const project = projects.find(p => p.id === id);
      if (project && project.id !== currentProject?.id) {
        setCurrentProject(project);
      }
    }
  }, [id, projects, currentProject, setCurrentProject]);

  // 包装 refreshProjects 以自动传入 token 和 userId
  const wrappedRefreshProjects = async () => {
    if (token && user?.id) {
      await refreshProjects(token, user.id);
    }
  };

  return {
    currentProject,
    setCurrentProject,
    projects,
    addProject,
    updateProject,
    refreshProjects: wrappedRefreshProjects,
    isLoading,
  };
}