import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProjectInfo } from "@/types/create-project";

const defaultProjectInfo: ProjectInfo = {
  name: "",
  location: "天津市",
  floors: "地下1层，地上5层",
  heightDiff: "0.6 米",
  structure: "框架结构",
  structureSystem: "框架结构体系",
  safetyLevel: "二级",
  area: "9820m²",
  buildingCount: "1",
  startDate: "2026年3月1日",
  durationLimit: "18个月",
  remarks: "",
};

const isBlankProjectInfo = (info?: ProjectInfo) => {
  if (!info) return true;
  return Object.values(info).every((value) => String(value ?? "").trim() === "");
};

interface CreateProjectState {
  projectDoc: File | null;
  cadFile: File | null;
  projectName: string;
  projectInfo: ProjectInfo;
  siteAddress: string;
  siteCoordinates: [number, number] | null;
  selectedPlan: number;
  activeChartTab: string;
  expandedProcess: string | null;
  isCreating: boolean;

  setProjectDoc: (file: File | null) => void;
  setCadFile: (file: File | null) => void;
  setProjectName: (name: string) => void;
  setProjectInfo: (info: ProjectInfo) => void;
  setSiteAddress: (address: string) => void;
  setSiteCoordinates: (coords: [number, number] | null) => void;
  setSelectedPlan: (plan: number) => void;
  setActiveChartTab: (tab: string) => void;
  setExpandedProcess: (process: string | null) => void;
  setIsCreating: (value: boolean) => void;
  reset: () => void;
}

export const useCreateProjectStore = create<CreateProjectState>()(
  persist(
    (set) => ({
      projectDoc: null,
      cadFile: null,
      projectName: "",
      projectInfo: defaultProjectInfo,
      siteAddress: "",
      siteCoordinates: null,
      selectedPlan: 1,
      activeChartTab: "resource",
      expandedProcess: "P01",
      isCreating: false,

      setProjectDoc: (file) => set({ projectDoc: file }),
      setCadFile: (file) => set({ cadFile: file }),
      setProjectName: (name) => set({ projectName: name }),
      setProjectInfo: (info) => set({ projectInfo: info }),
      setSiteAddress: (address) => set({ siteAddress: address }),
      setSiteCoordinates: (coords) => set({ siteCoordinates: coords }),
      setSelectedPlan: (plan) => set({ selectedPlan: plan }),
      setActiveChartTab: (tab) => set({ activeChartTab: tab }),
      setExpandedProcess: (process) => set({ expandedProcess: process }),
      setIsCreating: (value) => set({ isCreating: value }),
      reset: () =>
        set({
          projectDoc: null,
          cadFile: null,
          projectName: "",
          projectInfo: defaultProjectInfo,
          siteAddress: "",
          siteCoordinates: null,
          selectedPlan: 1,
          activeChartTab: "resource",
          expandedProcess: "P01",
          isCreating: false,
      }),
    }),
    {
      name: "create-project-store",
      partialize: (state) => ({
        projectName: state.projectName,
        projectInfo: state.projectInfo,
        siteAddress: state.siteAddress,
        siteCoordinates: state.siteCoordinates,
        selectedPlan: state.selectedPlan,
        activeChartTab: state.activeChartTab,
        expandedProcess: state.expandedProcess,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        if (isBlankProjectInfo(state.projectInfo)) {
          set({ projectInfo: defaultProjectInfo });
        }
      },
    },
  ),
);
