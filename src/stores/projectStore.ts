import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProjectState {
  currentProjectId: string | null;
  setCurrentProjectId: (projectId: string | null) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      currentProjectId: null,
      setCurrentProjectId: (projectId) => {
        set({ currentProjectId: projectId });
      },
      reset: () => {
        set({ currentProjectId: null });
      },
    }),
    {
      name: "project-storage",
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
      }),
    },
  ),
);
