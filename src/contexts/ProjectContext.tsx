
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

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
}

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// 模拟项目数据
const mockProjects: Project[] = [
  {
    id: "1",
    name: "办公楼建设项目",
    hasBasicInfo: true,
    city: "北京市",
    buildingType: "住宅",
    structureType: "框架结构",
    bidAmount: 0,
    controlPrice: 0,
    buildingHeight: 0,
    buildingFloors: 1,
    buildingArea: 0,
  },
  {
    id: "2", 
    name: "南山区幼儿园",
    hasBasicInfo: false,
  }
];

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProjectState] = useState<Project | null>(mockProjects[0] || null);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const { id } = useParams();
  const STORAGE_KEY = "currentProjectId";

  const setCurrentProject = (project: Project | null) => {
    setCurrentProjectState(project);
    if (project) {
      try { localStorage.setItem(STORAGE_KEY, project.id); } catch {}
    } else {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  };

  const addProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
  };

  const updateProject = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    if (currentProject && currentProject.id === updated.id) {
      setCurrentProject(updated);
    }
    try {
      localStorage.setItem('projects', JSON.stringify(prev => prev));
    } catch {}
  };

  // 当路由参数变化时，自动更新当前项目；无 id 时保持当前选择，不清空
  useEffect(() => {
    if (id) {
      const project = projects.find(p => p.id === id);
      if (project) {
        setCurrentProject(project);
      }
    } else if (!currentProject) {
      // 尝试从本地恢复上次选择，如果没有则选择第一个项目
      try {
        const savedId = localStorage.getItem(STORAGE_KEY);
        if (savedId) {
          const savedProject = projects.find(p => p.id === savedId);
          if (savedProject) {
            setCurrentProject(savedProject);
          } else if (projects.length > 0) {
            setCurrentProject(projects[0]);
          }
        } else if (projects.length > 0) {
          setCurrentProject(projects[0]);
        }
      } catch {
        if (projects.length > 0) {
          setCurrentProject(projects[0]);
        }
      }
    }
  }, [id, projects]);

  return (
    <ProjectContext.Provider value={{
      currentProject,
      setCurrentProject,
      projects,
      addProject,
      updateProject
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
