import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

interface ProjectState {
  currentProjectId: string | null;
  setCurrentProjectId: (projectId: string | null) => void;
  reset: () => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function getProjectStorage(): StateStorage {
  if (typeof window === "undefined") {
    return noopStorage;
  }

  try {
    return window.localStorage;
  } catch {
    return noopStorage;
  }
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
      storage: createJSONStorage(getProjectStorage),
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
      }),
    },
  ),
);
