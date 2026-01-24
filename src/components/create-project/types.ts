import { Dispatch, SetStateAction } from "react";

export interface ProjectInfo {
  name: string;
  location: string;
  floors: string;
  heightDiff: string;
  structure: string;
  structureSystem: string;
  safetyLevel: string;
  area: string;
  buildingCount: string;
  startDate: string;
  durationLimit: string;
  remarks: string;
}

export interface CreateProjectContextType {
  // File States
  projectDoc: File | null;
  setProjectDoc: Dispatch<SetStateAction<File | null>>;
  cadFile: File | null;
  setCadFile: Dispatch<SetStateAction<File | null>>;
  
  // Basic Info States
  projectName: string;
  setProjectName: Dispatch<SetStateAction<string>>;
  projectInfo: ProjectInfo;
  setProjectInfo: Dispatch<SetStateAction<ProjectInfo>>;
  
  // Location States
  siteAddress: string;
  setSiteAddress: Dispatch<SetStateAction<string>>;
  siteCoordinates: [number, number] | null;
  setSiteCoordinates: Dispatch<SetStateAction<[number, number] | null>>;
  
  // Selection & Preview States
  selectedPlan: number;
  setSelectedPlan: Dispatch<SetStateAction<number>>;
  activeChartTab: string;
  setActiveChartTab: Dispatch<SetStateAction<string>>;
  expandedProcess: string | null;
  setExpandedProcess: Dispatch<SetStateAction<string | null>>;
  
  // Global States
  isCreating: boolean;
  
  // Actions
  handleCreateProject: () => Promise<void>;
}
