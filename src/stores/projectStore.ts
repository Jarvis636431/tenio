import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getProjectList } from '@/services/project-service';
import type { Project } from '@/types/domain/project';

interface ProjectState {
  // State
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  
  // Actions
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  refreshProjects: (token: string, userId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const STORAGE_KEY = 'currentProjectId';

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProject: null,
      projects: [],
      isLoading: false,

      // Set current project and persist to localStorage
      setCurrentProject: (project: Project | null) => {
        set({ currentProject: project });
        
        if (project) {
          try {
            localStorage.setItem(STORAGE_KEY, project.id);
          } catch (error) {
            console.error('Failed to save current project ID:', error);
          }
        } else {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch (error) {
            console.error('Failed to remove current project ID:', error);
          }
        }
      },

      // Set projects list
      setProjects: (projects: Project[]) => {
        set({ projects });
      },

      // Add or update a project in the list
      addProject: (project: Project) => {
        set((state) => {
          const exists = state.projects.some(p => p.id === project.id);
          
          if (exists) {
            // Update existing project
            return {
              projects: state.projects.map(p => 
                p.id === project.id ? { ...p, ...project } : p
              )
            };
          } else {
            // Add new project
            return {
              projects: [...state.projects, project]
            };
          }
        });
      },

      // Update a project
      updateProject: (updated: Project) => {
        set((state) => {
          const newProjects = state.projects.map(p => 
            p.id === updated.id ? { ...p, ...updated } : p
          );
          
          // If updating the current project, update it too
          const newCurrentProject = state.currentProject?.id === updated.id
            ? updated
            : state.currentProject;
          
          return {
            projects: newProjects,
            currentProject: newCurrentProject
          };
        });
      },

      // Refresh projects from server
      refreshProjects: async (token: string, userId: string) => {
        if (!token || !userId) {
          set({ projects: [], currentProject: null });
          return;
        }

        set({ isLoading: true });
        
        try {
          const response = await getProjectList(token, userId);
          const projectList: Project[] = response.result.map(item => ({
            id: item.project_id,
            name: item.name,
            description: item.description,
            status: item.status,
            createdAt: item.created_at,
          }));
          
          set({ projects: projectList });

          if (projectList.length === 0) {
            set({ currentProject: null });
            return;
          }

          // Try to restore current project from various sources
          const { currentProject } = get();
          const savedId = localStorage.getItem(STORAGE_KEY);
          
          // Priority: current project in state > saved ID > first project
          let nextProject: Project | undefined;
          
          if (currentProject) {
            // Check if current project still exists
            nextProject = projectList.find(p => p.id === currentProject.id);
          }
          
          if (!nextProject && savedId) {
            // Try to find saved project
            nextProject = projectList.find(p => p.id === savedId);
          }
          
          if (!nextProject) {
            // Fallback to first project
            nextProject = projectList[0];
          }
          
          if (nextProject) {
            get().setCurrentProject(nextProject);
          } else {
            set({ currentProject: null });
          }
        } catch (error) {
          console.error('Failed to refresh project list:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Reset store to initial state
      reset: () => {
        set({
          currentProject: null,
          projects: [],
          isLoading: false,
        });
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          console.error('Failed to clear storage:', error);
        }
      },
    }),
    {
      name: 'project-storage',
      // Only persist currentProject ID, not the full object
      partialize: (state) => ({
        // We only store the ID, actual data comes from server
        currentProjectId: state.currentProject?.id,
      }),
      // Custom merge function to handle restoration
      merge: (persistedState: any, currentState) => {
        // Don't restore from persisted state, we'll use localStorage directly
        return currentState;
      },
    }
  )
);