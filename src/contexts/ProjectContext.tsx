
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  hasBasicInfo?: boolean;
}

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projects: Project[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// 模拟项目数据
const mockProjects: Project[] = [
  {
    id: "1",
    name: "办公楼建设项目",
    hasBasicInfo: true
  },
  {
    id: "2", 
    name: "项目 2",
    hasBasicInfo: false
  }
];

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects] = useState<Project[]>(mockProjects);
  const { id } = useParams();

  // 当路由参数变化时，自动更新当前项目
  useEffect(() => {
    if (id) {
      const project = projects.find(p => p.id === id);
      if (project) {
        setCurrentProject(project);
      }
    } else {
      setCurrentProject(null);
    }
  }, [id, projects]);

  return (
    <ProjectContext.Provider value={{
      currentProject,
      setCurrentProject,
      projects
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
