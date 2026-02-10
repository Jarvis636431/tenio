import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProjectInfo } from "@/types/create-project";
import type { SelectSolutionResponse } from "@/types/domain/schedulepro";

const defaultProjectInfo: ProjectInfo = {
  name: "",
  location: "天津市",
  floors: "地下1层，地上5层（含1层夹层）",
  heightDiff: "0.6 米",
  structure: "主体结构：采用钢筋混凝土框架——剪力墙结构体系，地下室顶板为梁板式结构。",
  structureSystem: "钢筋混凝土框架—剪力墙结构体系",
  safetyLevel: "抗震设防烈度为8度",
  area: "总建筑面积：12350㎡，其中地上建筑面积10300㎡，地下建筑面积2050㎡。",
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
  projectId: string;
  solutionData: SelectSolutionResponse | null;
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
  setProjectId: (id: string) => void;
  setSolutionData: (data: SelectSolutionResponse | null) => void;
  setProjectInfo: (info: ProjectInfo | ((prev: ProjectInfo) => ProjectInfo)) => void;
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
      projectId: "",
      solutionData: null,
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
      setProjectId: (id) => set({ projectId: id }),
      setSolutionData: (data) => set({ solutionData: data }),
      setProjectInfo: (info) =>
        set((state) => ({
          projectInfo: typeof info === "function" ? info(state.projectInfo) : info,
        })),
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
          projectId: "",
          solutionData: null,
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
        projectId: state.projectId,
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
