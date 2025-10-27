
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectList } from '@/services/project-service';
import { useAuth } from '@/contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  hasBasicInfo?: boolean;
  // 可编辑基础信息字段
  city?: string;
  buildingType?: string;
  structureType?: string;
  bidAmount?: number;
  controlPrice?: number;
  buildingHeight?: number;
  buildingFloors?: number;
  buildingArea?: number;
  status?: string;
  createdAt?: string;
  description?: string;
}

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { id } = useParams();
  const STORAGE_KEY = "currentProjectId";
  const { token, user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const setCurrentProject = (project: Project | null) => {
    setCurrentProjectState(project);
    if (project) {
      try { localStorage.setItem(STORAGE_KEY, project.id); } catch {}
    } else {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  };

  const refreshProjects = async () => {
    if (!token || !user?.id) {
      setProjects([]);
      setCurrentProjectState(null);
      return;
    }

    setIsRefreshing(true);
    try {
      const response = await getProjectList(token, user.id);
      const projectList: Project[] = response.projects.map(item => ({
        id: item.project_id,
        name: item.name,
        description: item.description,
        status: item.status,
        createdAt: item.created_at,
      }));
      setProjects(projectList);

      if (projectList.length === 0) {
        setCurrentProjectState(null);
        return;
      }

      const routeProject = id ? projectList.find(p => p.id === id) : undefined;
      const savedId = localStorage.getItem(STORAGE_KEY);
      const savedProject = savedId ? projectList.find(p => p.id === savedId) : undefined;
      const nextProject = routeProject || savedProject || projectList[0];
      if (nextProject) {
        setCurrentProjectState(nextProject);
        try {
          localStorage.setItem(STORAGE_KEY, nextProject.id);
        } catch {}
      } else {
        setCurrentProjectState(null);
      }
    } catch (error) {
      console.error('Failed to refresh project list:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const addProject = (project: Project) => {
    setProjects(prev => {
      const exists = prev.some(p => p.id === project.id);
      if (exists) {
        return prev.map(p => p.id === project.id ? { ...p, ...project } : p);
      }
      return [...prev, project];
    });
  };

  const updateProject = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    if (currentProject && currentProject.id === updated.id) {
      setCurrentProject(updated);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchProjects = async () => {
      if (!token || !user?.id) {
        setProjects([]);
        setCurrentProjectState(null);
        return;
      }

      setIsLoading(true);
      try {
        await refreshProjects();
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchProjects();

    return () => {
      active = false;
    };
  }, [token, user?.id, id]);

  // 当路由参数变化时，自动更新当前项目；无 id 时保持当前选择，不清空
  useEffect(() => {
    if (id && projects.length > 0) {
      const project = projects.find(p => p.id === id);
      if (project) {
        setCurrentProject(project);
      }
    }
  }, [id, projects]);

  return (
    <ProjectContext.Provider value={{
      currentProject,
      setCurrentProject,
      projects,
      addProject,
      updateProject,
      refreshProjects,
      isLoading,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
