import { create } from "zustand";

export interface GenerationProgressStep {
  code: string;
  name: string;
  order: number;
  status: string;
}

export interface GenerationTask {
  projectId: string;
  generationJobId: string;
  generationStatus: string;
  startedAt: string;
  deleteProjectOnCancel?: boolean;
  currentStepName?: string;
  progressPercent?: number;
  steps: GenerationProgressStep[];
  errorMessage?: string | null;
}

interface GenerationState {
  task: GenerationTask | null;
  startGeneration: (
    task: Omit<GenerationTask, "steps"> & { steps?: GenerationProgressStep[] },
  ) => void;
  updateGeneration: (updates: Partial<GenerationTask>) => void;
  failGeneration: (message: string) => void;
  clearGeneration: () => void;
}

export const useGenerationStore = create<GenerationState>()((set) => ({
  task: null,
  startGeneration: (task) =>
    set({
      task: {
        ...task,
        steps: task.steps ?? [],
        errorMessage: null,
      },
    }),
  updateGeneration: (updates) =>
    set((state) => ({
      task: state.task ? { ...state.task, ...updates } : null,
    })),
  failGeneration: (message) =>
    set((state) => ({
      task: state.task
        ? {
            ...state.task,
            generationStatus: "failed",
            errorMessage: message,
          }
        : null,
    })),
  clearGeneration: () => set({ task: null }),
}));
