export interface Project {
  id: string;
  name: string;
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

export interface ProjectListItem {
  project_id: string;
  project_name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export type ProjectListResponse = ProjectListItem[];
